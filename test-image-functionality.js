const { crawlWebsite } = require('./server/scanning/web-crawler.ts');

async function testImageFunctionality() {
  console.log('Testing image functionality...');
  
  try {
    // Test with a website that has images
    const testUrl = 'https://www.example.com';
    console.log(`Testing with URL: ${testUrl}`);
    
    const result = await crawlWebsite(testUrl, 1);
    
    console.log('Crawl Results:');
    console.log(`- Total pages: ${result.results.length}`);
    console.log(`- Total issues: ${result.issues.length}`);
    
    // Check for accessibility issues with images
    const accessibilityIssues = result.issues.filter(issue => issue.type === 'accessibility');
    console.log(`- Accessibility issues: ${accessibilityIssues.length}`);
    
    if (accessibilityIssues.length > 0) {
      const imageIssue = accessibilityIssues.find(issue => 
        issue.details && issue.details.imageDetails
      );
      
      if (imageIssue) {
        console.log('✅ Image functionality is working!');
        console.log(`- Found ${imageIssue.details.imageDetails.length} images without alt text`);
        console.log('Sample image details:', imageIssue.details.imageDetails[0]);
      } else {
        console.log('❌ No image details found in accessibility issues');
      }
    } else {
      console.log('❌ No accessibility issues found');
    }
    
    // Check individual page results
    result.results.forEach((page, index) => {
      console.log(`Page ${index + 1}: ${page.url}`);
      console.log(`- Missing alt texts: ${page.missingAltTexts}`);
      console.log(`- Total images: ${page.totalImages}`);
      console.log(`- Image details: ${page.imageDetails.length}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testImageFunctionality(); 