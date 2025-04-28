import express from 'express';
import { engine } from 'express-handlebars';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
// Alternative ports to try if the main port is busy
const ALTERNATIVE_PORTS = [3001, 3002, 3003, 3004, 3005];

// Register Handlebars as the view engine
app.engine('hbs', engine({ 
  extname: '.hbs',
  defaultLayout: 'base',
  layoutsDir: __dirname,
  partialsDir: path.join(__dirname, 'partials')
}));
app.set('view engine', 'hbs');
app.set('views', __dirname);

// Serve static files
app.use(express.static(__dirname));

// Image mapping for local files
const IMAGE_MAPPING = {
  'https://example.com/idcertify-logo.png': '/images/idcertify-logo.png',
  'https://example.com/receipt-icon.png': '/images/receipt-icon.png'
};

// Helper to create placeholder images
async function createPlaceholderImages() {
  const imagesDir = path.join(__dirname, 'images');
  
  try {
    await fs.access(imagesDir);
  } catch (error) {
    // Create the directory if it doesn't exist
    await fs.mkdir(imagesDir, { recursive: true });
    console.log('Created images directory');
  }
  
  // Create placeholder images if they don't exist
  const imagesToCreate = [
    { filename: 'idcertify-logo.png', width: 200, height: 40, text: 'ID Certify Logo' },
    { filename: 'receipt-icon.png', width: 100, height: 100, text: 'Receipt Icon' }
  ];
  
  for (const image of imagesToCreate) {
    const imagePath = path.join(imagesDir, image.filename);
    try {
      await fs.access(imagePath);
      console.log(`Image ${image.filename} already exists`);
    } catch (error) {
      // Create a text file as placeholder for now
      // In a real app, you would download or generate actual images
      await fs.writeFile(
        imagePath, 
        `This is a placeholder for ${image.text} (${image.width}x${image.height}). Replace with real image.`
      );
      console.log(`Created placeholder for ${image.filename}`);
    }
  }
}

// Get list of all templates
async function getTemplatesList() {
  const files = await fs.readdir(__dirname);
  return files
    .filter(file => file.endsWith('.hbs') && file !== 'base.hbs')
    .map(file => file.replace('.hbs', ''));
}

// Helper to extract all image URLs from templates
async function extractImageUrls() {
  const imageUrls = new Set();
  const templates = await getTemplatesList();
  
  // Add base.hbs and partials to the list
  templates.push('base');
  
  try {
    const partials = await fs.readdir(path.join(__dirname, 'partials'));
    for (const partial of partials) {
      if (partial.endsWith('.hbs')) {
        templates.push(`partials/${partial.replace('.hbs', '')}`);
      }
    }
  } catch (error) {
    console.log('No partials directory found or error reading it:', error.message);
  }
  
  // Extract image URLs from each template
  for (const template of templates) {
    try {
      let templatePath = template;
      if (!templatePath.includes('/')) {
        templatePath = `${templatePath}.hbs`;
      } else {
        templatePath = `${templatePath}.hbs`;
      }
      
      const content = await fs.readFile(path.join(__dirname, templatePath), 'utf8');
      
      // Simple regex to find image URLs (not perfect but works for basic cases)
      const imgRegex = /<img[^>]*src="(https?:\/\/[^"]+)"/g;
      let match;
      
      while ((match = imgRegex.exec(content)) !== null) {
        imageUrls.add(match[1]);
      }
    } catch (error) {
      console.log(`Error reading template ${template}:`, error.message);
    }
  }
  
  return Array.from(imageUrls);
}

// Function to download an image
function downloadImage(url, destination) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(destination);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    });
    
    request.on('error', (err) => {
      reject(err);
    });
  });
}

// Home page - list all templates
app.get('/', async (req, res) => {
  try {
    const templates = await getTemplatesList();
    const imageUrls = await extractImageUrls();
    
    res.send(`
      <html>
        <head>
          <title>Handlebars Email Templates</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1, h2 { color: #333; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
            a { color: #0066cc; text-decoration: none; display: inline-block; margin-right: 15px; }
            a:hover { text-decoration: underline; }
            .image-list { margin-top: 30px; }
          </style>
        </head>
        <body>
          <h1>Available Email Templates</h1>
          <ul>
            ${templates.map(template => `
              <li>
                <strong>${template}</strong>
                <div style="margin-top: 8px;">
                  <a href="/preview/${template}">Preview Template</a>
                  <a href="/raw/${template}">View Raw HTML</a>
                </div>
              </li>
            `).join('')}
          </ul>
          
          <div class="image-list">
            <h2>Images Used in Templates</h2>
            <ul>
              ${imageUrls.map(url => `
                <li>
                  <div>${url}</div>
                  <div style="margin-top: 8px;">
                    <a href="/download-image?url=${encodeURIComponent(url)}">Download to images folder</a>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Route to download an image
app.get('/download-image', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).send('No URL provided');
  }
  
  try {
    const imagesDir = path.join(__dirname, 'images');
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Extract filename from URL
    const urlObj = new URL(url);
    const filename = path.basename(urlObj.pathname);
    const destination = path.join(imagesDir, filename);
    
    // Create a placeholder file (in a real app, you would download the actual image)
    await fs.writeFile(
      destination, 
      `This is a placeholder for ${filename}. In a real app, the image would be downloaded from ${url}.`
    );
    
    res.send(`
      <html>
        <head>
          <title>Image Downloaded</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .success { color: green; }
            .back { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1 class="success">Image Placeholder Created!</h1>
          <p>Created placeholder for image: ${filename}</p>
          <p>Original URL: ${url}</p>
          <p>Saved to: ${destination}</p>
          <p>In a real application, the actual image would be downloaded. This is just a placeholder file.</p>
          <p>To use local images in your templates, update image paths to: /images/${filename}</p>
          <div class="back">
            <a href="/">Back to Templates</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error creating image placeholder: ${error.message}`);
  }
});

// Preview a template with sample data
app.get('/preview/:template', async (req, res) => {
  const { template } = req.params;
  
  try {
    // Sample data that works for all templates
    const data = {
      candidateName: 'John Doe',
      verificationType: 'Identity',
      companyName: 'Example Company LTD',
      jobRole: 'Software Developer',
      verificationUrl: 'https://example.com/verify/123456',
      expiryDays: 3,
      days: '02',
      hours: '23',
      minutes: '54',
      seconds: '58',
      companyPhone: '07000474822',
      companyEmail: 'contact@example.com',
      companyAddress: '123 Example Street',
      reportUrl: 'https://example.com/report/123456',
      year: new Date().getFullYear(),
      qrCodeUrl: '/images/sample-qr-code.png'
    };
    
    res.render(template, data);
  } catch (error) {
    res.status(500).send(`Error rendering template: ${error.message}`);
  }
});

// View raw compiled HTML
app.get('/raw/:template', async (req, res) => {
  const { template } = req.params;
  
  try {
    // Use the existing rendering logic from your index.js
    const templateContent = await fs.readFile(path.join(__dirname, `${template}.hbs`), 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(templateContent);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Function to start the server with port fallback
function startServer(port, remainingPorts = []) {
  // Initialize placeholder images
  createPlaceholderImages()
    .then(() => {
      console.log('Image placeholders initialized');
    })
    .catch(error => {
      console.error('Error creating image placeholders:', error);
    });
  
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`View your Handlebars templates in the browser!`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying another port...`);
      
      if (remainingPorts.length > 0) {
        const nextPort = remainingPorts.shift();
        startServer(nextPort, remainingPorts);
      } else {
        console.error('All ports are busy. Please specify an available port using the PORT environment variable.');
        process.exit(1);
      }
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
}

// Start the server with fallback ports
startServer(PORT, ALTERNATIVE_PORTS); 