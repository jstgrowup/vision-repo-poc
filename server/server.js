// server.js
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cloudinary from "cloudinary";
import pdf from "pdf-poppler";
import { PDFDocument } from "pdf-lib";
import { configDotenv } from "dotenv";
import cors from "cors";

configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

cloudinary.v2.config({
  cloud_name: "drrilcisg",
  api_key: process.env.CLOUDINARY_API_KEYS,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadToCloudinary = (imagePath, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(imagePath, options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

const app = express();
const port = process.env.PORT || 8000;
app.use(
  cors({
    origin: "*",
  })
);
const UPLOAD_DIR = path.join(__dirname, "uploads");
const TEMP_DIR = path.join(__dirname, "temp");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

const init = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error("Error creating directories:", err);
  }
};

init();

async function pdfPageToImage(pdfPath, pageNumber) {
  try {
    // Create unique filenames based on timestamp and original filename
    const timestamp = Date.now();
    const basename = path.basename(pdfPath, ".pdf");

    // Extract the specific page from the PDF using pdf-lib
    const pdfData = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfData);

    if (pageNumber >= pdfDoc.getPageCount()) {
      throw new Error(`Page ${pageNumber} does not exist in the PDF.`);
    }

    // Create a new document with just the requested page
    const newPdfDoc = await PDFDocument.create();
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber]);
    newPdfDoc.addPage(copiedPage);

    // Save the single-page PDF
    const singlePagePdfBytes = await newPdfDoc.save();
    const tempPdfPath = path.join(
      TEMP_DIR,
      `${timestamp}-${basename}-page-${pageNumber}.pdf`
    );
    await fs.writeFile(tempPdfPath, singlePagePdfBytes);

    const popplerOptions = {
      format: "png",
      out_dir: TEMP_DIR,
      out_prefix: `${timestamp}-${basename}-page-${pageNumber}`,
      page: 1, // pdf-poppler uses 1-based page counting
    };

    // Convert PDF to PNG using pdf-poppler
    await pdf.convert(tempPdfPath, popplerOptions);

    // pdf-poppler creates files named like: prefix-1.png
    const outputImagePath = path.join(
      TEMP_DIR,
      `${popplerOptions.out_prefix}-1.png`
    );

    // Check if the file was actually created
    try {
      await fs.access(outputImagePath);
    } catch (err) {
      throw new Error(
        `PDF conversion failed: Output file not found at ${outputImagePath}`
      );
    }

    // Cleanup the temporary single-page PDF
    await fs
      .unlink(tempPdfPath)
      .catch((err) => console.warn("Error deleting temp PDF:", err));

    return outputImagePath;
  } catch (error) {
    console.error(`Error converting PDF page ${pageNumber} to image:`, error);
    throw error;
  }
}

app.post("/upload-pdfs", upload.array("pdfs", 1), async (req, res) => {
  console.log("post:");
  try {
    // if (!req.files || req.files.length !== 2) {
    //   return res.status(400).json({
    //     error: "Please upload exactly two PDF files.",
    //   });
    // }
    const file = req.files[0];
    console.log("file:", file);

    // Convert the first page of each PDF to an image
    const imagePath = await pdfPageToImage(file.path, 0);

    // Upload the image to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(imagePath, {
      folder: "pdf-conversions",
      public_id: `${path.basename(file.originalname, ".pdf")}-page-0`,
    });
    console.log(`Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);

    // Clean up temporary files
    await fs
      .unlink(imagePath)
      .catch((err) => console.warn("Error deleting temp image:", err));
    await fs
      .unlink(file.path)
      .catch((err) => console.warn("Error deleting uploaded PDF:", err));

    // return {
    //   originalFile: file.originalname,
    //   cloudinaryUrl: cloudinaryResult.secure_url,
    //   publicId: cloudinaryResult.public_id,
    // };
    return res.json({
      success: true,
      message: "PDF pages converted and uploaded successfully",
      image: cloudinaryResult.secure_url,
    });

    // Wait for all conversions and uploads to complete
  } catch (error) {
    console.error("Error processing PDFs:", error);
    res.status(500).json({
      success: false,
      message: "Error processing PDFs",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
