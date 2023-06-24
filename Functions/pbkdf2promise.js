const crypto  = require('node:crypto');

function pbkdf2(password, salt, iterations, keylen, digest) {
	return new Promise((resolve, reject) => {
		crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, res) => {
			if (err)
				reject(err);
			else
				resolve(res);
		});
	});
}

exports.pbkdf2 = pbkdf2;
