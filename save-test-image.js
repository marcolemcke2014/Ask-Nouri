const fs = require('fs');
const path = require('path');

// Function to save a test menu image
function saveTestImage() {
  try {
    // Create attached_assets directory if it doesn't exist
    const dir = path.join(__dirname, 'attached_assets');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create a more substantial placeholder image (1KB+ in size)
    // This is a very small but valid JPEG that will display as a gradient
    const sampleImageData = Buffer.from(
      '/9j/4AAQSkZJRgABAQEASABIAAD/4QD2RXhpZgAATU0AKgAAAAgAAgESAAMAAAABAAEAAIdpAAQAAAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAEsKADAAQAAAABAAAEsAAAAABBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKQAyMDIzOjEwOjE0IDA3OjIxOjU2AAAEkAMAAgAAABQAAACukAQAAgAAABQAAADCAAAAMjAyMzoxMDoxNCAwNzoyMTo1NgBUZXN0IE1lbnUgSW1hZ2UAAgABpAMAAQAAAAEAAAAAoAIABAAAAAEAAASwpAIABAAAAAEAAASwAAAAAP/hDm1odHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTEwLTE0VDA3OjIxOjU2IiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0xMC0xNFQwNzoyMTo1NiIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0xMC0xNFQwNzoyMTo1NiIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Y2YyYTYzODYtZmMwMy00YzE4LWFkYmItYzg3ZTcwZTQyYmMzIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOmNmMmE2Mzg2LWZjMDMtNGMxOC1hZGJiLWM4N2U3MGU0MmJjMyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmNmMmE2Mzg2LWZjMDMtNGMxOC1hZGJiLWM4N2U3MGU0MmJjMyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6Y2YyYTYzODYtZmMwMy00YzE4LWFkYmItYzg3ZTcwZTQyYmMzIiBzdEV2dDp3aGVuPSIyMDIzLTEwLTE0VDA3OjIxOjU2IiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+',
      'base64'
    );
    
    const filePath = path.join(dir, 'test-menu.jpg');
    fs.writeFileSync(filePath, sampleImageData);
    
    // Print file size to verify it's not empty
    const stats = fs.statSync(filePath);
    console.log(`Test image saved to ${filePath} (${Math.round(stats.size / 1024)} KB)`);
  } catch (error) {
    console.error('Error saving test image:', error);
  }
}

// Run the function
saveTestImage(); 