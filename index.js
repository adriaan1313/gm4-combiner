const fs = require(`fs`);
const express = require(`express`);
const app = express();
const server = app.listen(process.env.PORT || 5000, () => console.log(`listening to port `+process.env.PORT || 5000));
const cloneGit = require(`download-git-repo`);
const mergedirs = require('merge-dirs').default;
const mergeJSON = require(`json-merger`).mergeObjects;
const zip = require('zip-folder');
app.get(`/generate`, generate);
app.use(express.static("public_html"));
async function generate(req, res) {
	res.send(`generating...`);
	if(fs.existsSync(`tmp`)){
		console.log(`removing tmp`);
		fs.rmdirSync('tmp', { recursive: true });
	}
	console.log(`downloading`);
	cloneGit('github:Gamemode4Dev/GM4_Datapacks#master', "tmp", function (err) {
		if(err){
			console.log(`Error: ${err}`);
		}else{
			console.log(`Downloaded!`);
			merge();
			if(!fs.existsSync(__dirname+`/release`))	fs.mkdirSync(__dirname+`/release`, {recursive: true}, err => console.log(err));
			zip(`${__dirname}/tmp/merged`, `${__dirname}/release/gm4_all_${timestamp()}.zip`, (e)=>{console.log(e ? `Error: ${e}` : `/release/gm4_all_${timestamp()}.zip created`)});
		}
	});
};

function merge(){
	let packs = mergeTags(fs.readdirSync("tmp").filter(name => name.indexOf(`.`) == -1 && name != "gm4_template_pack"));
	packs.forEach((dir, i) => {
		mergedirs("tmp/" + dir, "tmp/" + (packs[i+1] || `merged`), `skip`);
		console.log(`merged ${dir} and ${packs[i+1] || `merged`}`);
	});
	if(fs.existsSync("tmp/merged/pack.mcmeta")) fs.unlinkSync("tmp/merged/pack.mcmeta");
	if(fs.existsSync("tmp/merged/_pack.mcmeta")) fs.unlinkSync("tmp/merged/_pack.mcmeta");
	write(JSON.stringify({"pack":{"pack_format": 6,"description": "All of GM4 combined into one pack!"}}), __dirname+`/tmp/merged/pack.mcmeta`);
}
//mergeTags(fs.readdirSync("tmp").filter(name => name.indexOf(`.`) == -1 && name != "gm4_template"));
function mergeTags(packs) {
	console.log(`starting tag merge`);
	let tagMerge = {};
	for(let i=0;i<packs.length;i++){
		const data = fs.readdirSync(`tmp/${packs[i]}/data`).filter((d) => fs.readdirSync(`tmp/${packs[i]}/data/`+d).indexOf(`tags`) != -1);
		for(let j=0;j<data.length;j++){
			const tagTypes = fs.readdirSync(`tmp/${packs[i]}/data/${data[j]}/tags/`);
			for(let k=0;k<tagTypes.length;k++){
				const tags = fs.readdirSync(`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/`);
				for(let l=0;l<tags.length;l++){
					if(tags[l].indexOf('.json') != -1){
						if(!tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}`]){tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}`] = [`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}`]}
						else tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}`].push(`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}`);
					}else{
						const subTags = fs.readdirSync(`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}`);
						for(let m=0;m<subTags.length;m++){
							if(subTags[m].indexOf('.json') != -1){
								if(!tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}`]){tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}`] = [`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}`]}
								else tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}`].push(`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}`);
							}else throw `Someone created a level three in ${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}!`;
						}
					}
				}
			}
		}
	}
	//
	console.log(`writing tag merge`);
	const out = Object.keys(tagMerge);
	for(let i=0;i<out.length;i++){
		let tmp = {};
		for(let j=0;j<tagMerge[out[i]].length;j++){
			tmp = mergeJSON([tmp, JSON.parse(fs.readFileSync(tagMerge[out[i]][j]))]);
		}
		write(out[i], JSON.stringify(tmp));
	}
	packs.push(`tagMerge`);
	console.log(`finished tag merge`);
	return packs;
}

function write(path, data){
	const a = path.split('/');
	const b = path.split(a[a.length-1])[0];
	if(!fs.existsSync(b))	fs.mkdirSync(b, {recursive:true});
	fs.writeFileSync(path, data);
}

const timestamp=_=>{
	const d = new Date(Date.now());
	return `${d.getUTCDate()}.${d.getUTCMonth()+1}.${d.getUTCFullYear()}_${d.getUTCHours()}.${d.getUTCMinutes()}.${d.getUTCSeconds()}`;
}
