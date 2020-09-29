const { SPOTIFY_ID, SPOTIFY_SECRET } = require('../config.json');
const { XMLHttpRequest } = require('xmlhttprequest');

module.exports = {
	// Returns OAuth token for Spotify API
	async createToken() { 
		const promise = new Promise((resolve, reject) => {
			let req = new XMLHttpRequest(); 

			req.open('POST', 'https://accounts.spotify.com/api/token', true);
			req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			req.setRequestHeader('Authorization', 'Basic ' + Buffer.from(SPOTIFY_ID + ':' + SPOTIFY_SECRET).toString('base64'));
			req.onreadystatechange = function() {
		    	if(req.readyState == 4 && req.status == 200 && req.responseText) {
		            try {
				    	resolve(JSON.parse(req.responseText).access_token);
				    } catch(error) {
				    	console.error(error);
				    }
		        }
			};
			req.send('grant_type=client_credentials');	
		}); 
		return promise;
	}
};