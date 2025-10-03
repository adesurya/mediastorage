const bcrypt = require('bcryptjs');

// Ganti dengan password yang Anda inginkan
const password = 'admin123';

bcrypt.hash(password, 10, function(err, hash) {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  
  console.log('\n=================================');
  console.log('Password Hash Generator');
  console.log('=================================');
  console.log('Plain Password:', password);
  console.log('Hashed Password:', hash);
  console.log('=================================\n');
  console.log('Copy hash di atas dan masukkan ke database MySQL:');
  console.log(`UPDATE users SET password = '${hash}' WHERE username = 'admin';`);
  console.log('\n');
});