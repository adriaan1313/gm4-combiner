const fs = require(`fs`);
require('dotenv').config();
const express = require(`express`);
const app = express();
const server = app.listen(process.env.PORT || 5000, () => console.log(`listening to port `+process.env.PORT || 5000));
const cloneGit = require(`download-git-repo`);
const mergedirs = require('merge-dirs').default;
//const mergeJSON = require(`object-merger`);
const zip = require('zip-folder');
app.get(`/generate`, generate);
app.use("/", express.static(__dirname + '/release'));
async function generate(req, res) {
	res.send(`generating...`);
	if(fs.existsSync(`tmp`)){
		console.log(`removing tmp`);
		fs.rmdirSync('tmp', { recursive: true });
	}
	fs.mkdirSync(__dirname+`/tmp`, {recursive: true});
	console.log(`downloading`);
	cloneGit('github:Gamemode4Dev/GM4_Datapacks#master', "tmp", function (err) {
		if(err){
			console.log(`Error: ${err} from cloneGit`);
		}else{
			console.log(`Downloaded!`);
			merge();
			if(!fs.existsSync(`release/`)) fs.mkdirSync(__dirname+`/release`, {recursive: true});
			const ts = timestamp();
			zip(`${__dirname}/tmp/merged`, `release/gm4_all_${ts}.zip`, (e)=>{
				console.log(e ? `Error: ${e}` : `/release/gm4_all_${timestamp()}.zip created`);
				if(!fs.existsSync(`release/release.json`)) write(`release/release.json`, `[]`);
				let a = JSON.parse(fs.readFileSync(`release/release.json`));
				a.push(ts);
				write(`release/release.json`, JSON.stringify(a));
			});
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
	write(`tmp/merged/pack.mcmeta`, JSON.stringify({"pack":{"pack_format": 6,"description": "All of GM4 combined into one pack!"}}));
}
//mergeTags(fs.readdirSync("tmp").filter(name => name.indexOf(`.`) == -1 && name != "gm4_template"));
function mergeTags(packs) {
	console.log(`starting tag merge: ${packs}`);
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
							}else{
								const subSubTags = fs.readdirSync(`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}`);
								for(let n=0;n<subSubTags.length;n++){
									if(subSubTags[n].indexOf('.json') != -1){
										if(!tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}`]){tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}`] = [`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}`]}
										else tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}`].push(`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}`);
									}else{
										const subSubSubTags = fs.readdirSync(`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}`);
										for(let o=0;o<subSubSubTags.length;o++){
											if(subSubSubTags[o].indexOf('.json') != -1){
												if(!tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}/${subSubSubTags[o]}`]){tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}/${subSubSubTags[o]}`] = [`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}/${subSubSubTags[o]}`]}
												else tagMerge[`tmp/tagMerge/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}/${subSubSubTags[o]}`].push(`tmp/${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}/${subSubSubTags[o]}`);
											}else throw `Someone created a level five in ${packs[i]}/data/${data[j]}/tags/${tagTypes[k]}/${tags[l]}/${subTags[m]}/${subSubTags[n]}/${subSubSubTags[o]}!`;
										}
									}
								}
							}
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
			tmp = mergeJSON(tmp, JSON.parse(fs.readFileSync(tagMerge[out[i]][j])));
		}
		write(out[i], JSON.stringify(tmp));
	}
	packs.push(`tagMerge`);
	console.log(`finished tag merge`);
	return packs;
}

function write(path, data){
	const a = path.split('/');
	const b = path.split(a.pop())[0];
	if(!fs.existsSync(b))	fs.mkdirSync(b, {recursive:true});
	fs.writeFileSync(path, data);
}

const timestamp=_=>{
	const d = new Date(Date.now());
	return `${d.getUTCDate()}.${d.getUTCMonth()+1}.${d.getUTCFullYear()}_${d.getUTCHours()}.${d.getUTCMinutes()}.${d.getUTCSeconds()}`;
}


/* MODEFIED VERSION OF:
 * Object Merger
 * by Jarrad Seers <jarrad@seers.me>
 */
function mergeJSON(...args) {
  const res = {};

  /**
   * Apply Function.
   *
   * @param {any} obj object to apply
   * @param {any} cur cursor location
   */

  function apply(obj, cur) {
    if (typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => {
      if (Array.isArray(obj[key])) {
        cur[key] = cur[key]
          //? cur[key].concat(cur[key])
		  ? [...new Set([...cur[key],...obj[key]])]
          : obj[key];
      } else if (typeof obj[key] === 'object') {
        cur[key] = cur[key] || {};
        apply(obj[key], cur[key]);
      } else {
        cur[key] = obj[key];
      }
    });
  }

  /**
   * Apply merge for each object argument.
   */

  args.forEach((obj) => apply(obj, res));

  return res;
}
