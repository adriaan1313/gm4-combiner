const fs = require(`fs`);
const express = require(`express`);
const app = express();
const server = app.listen(80, () => console.log(`listening to port 80`));
const cloneGit = require(`download-git-repo`);
app.get(`/generate`, generate);

async function generate(req, res) {
	if(fileExists(`gm4-all.zip`)) console.log(`regenerating zip`);
	else console.log(`generating zip`);
	res.send(`generating...`);
};





function fileExists(file){
	fs.access(file, (a) => {
		if (a) {
			return false;
		}else {return true;}
	});
	
};