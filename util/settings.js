const { PREFIX } = require('../config.json');
const fs = require('fs');
if(!fs.existsSync('./server_settings.json')) {
	fs.writeFileSync('./server_settings.json', '{}', { flag: 'wx' }, function (err) { // Create files if doesnt exists
	    if(err) throw err;
	});
}
const settings = require('../server_settings.json');

module.exports = {
	newSettings(servers, guild) {
		servers.set(guild.id, {
	    	guild,
	    	queue: null,
	    	timer: null,
	    	prefix: PREFIX,
			volume: 100,
			autoplay: true
	    });
	},
	saveSettings(servers) {
		const serverSettings = JSON.stringify(mapToObj(servers), null, 2);;
		fs.writeFileSync('server_settings.json', serverSettings);
		console.log(`SAVED SERVER SETTINGS!`);
	},
	getSettings() {
		return objToMap(settings);
	}
}

function mapToObj(map) {
  let obj = Object.create(null);
  Array.from(map).forEach(([k, v]) => {
  	obj[k] = {
    	prefix: v.prefix,
		volume: v.volume,
		autoplay: v.autoplay
  	}
  });
  return obj;
}

function objToMap(obj) {
	let map = new Map();
	Object.keys(obj).forEach(k => {
		map.set(k, {
			guild: null,
	    	queue: null,
	    	timer: null,
	    	prefix: obj[k].prefix,
			volume: obj[k].volume,
			autoplay: obj[k].autoplay
		});
	});
	return map;
}