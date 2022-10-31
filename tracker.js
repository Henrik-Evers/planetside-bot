const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = "NzQzMTkwMTU4MTMxNTkzMzg5.XzRDxQ.biMw9DNxBDvHSlzEviovSRIqATM"; // Discord bot token
// const serviceID = "/s:personnnnnnnnnnnnnisbotting"; // Daybreak service ID
const serviceID = "/s:example";

const WebSocket = require('ws'); // For streaming API
const http = require('http'); // For census API
const fs = require('fs'); // For files

const hardID = 743189713229316096; // #ps2-hard-focus
const softID = 743231547494367273; // #ps2-soft-focus

let tracking = [];
let tracking1 = "";

function updateTrackingInfo() {
	tracking = JSON.parse(fs.readFileSync('tracker.json')).tracking;
	tracking1 = JSON.stringify(tracking);
}

let cache = {};
let players = [];
let players0 = [];
let exp = [];
let exp0 = [];
let loadout = [];
let loadout0 = [];
let facility = [];
let facility0 = [];
let vehicles = [];
let vehicles0 = [];

function updateCache() { // Update JS side to be equal to JSON side
	cache = JSON.parse(fs.readFileSync('cache.json'));
	players = cache.players;
	exp = cache.expTypes;
  loadout = cache.loadoutTypes;
  facility = cache.facilities;
  vehicles = cache.vehicles;

	for (let i = 0; i < players.length; i++) {
	  players0[i] = players[i][0];
	}
	for (let i = 0; i < exp.length; i++) {
	  exp0[i] = exp[i][0];
	}
	for (let i = 0; i < loadout.length; i++) {
	  loadout0[i] = loadout[i][0];
	}
  for (let i = 0; i < facility.length; i++) {
    facility0[i] = facility[i][0];
  }
  for (let i = 0; i < vehicles.length; i++) {
    vehicles0[i] = vehicles[i][0];
  }
}

async function updatedCache() { // Update JSON side to be equal to JS side
	fs.writeFileSync('cache.json', JSON.stringify(cache), function (err) { if (err) throw err; });
	updateCache();
}

updateTrackingInfo();
updateCache();

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async msg => {
  if (msg.channel.id == hardID) { // Responds in Hard Focus
    if (msg.content === 'ping') {
      msg.channel.send('pong');
    }
    else if (msg.content === '!connect') {
      socket = new WebSocket("wss://push.planetside2.com/streaming?environment=ps2&service-id=" + serviceID.substring(1));
      setTimeout(async function() {
        socket.send('{"action":"echo","payload":{"test":"test"},"service":"event"}');
        socket.onmessage = async function(event) {
          eventData = JSON.parse(event.data);
          console.log(eventData);
  				if (eventData.type != "heartbeat" && eventData.type != "serviceStateChanged" && eventData.payload) {
            let charIsTracked = (tracking.includes(eventData.payload.character_id));
            if (charIsTracked || tracking.includes(eventData.payload.attacker_character_id)) {
              let attCharIsTracked = !charIsTracked;
							let charName = (charIsTracked) ? await getNameByID(eventData.payload.character_id) : await getNameByID(eventData.payload.attacker_character_id);
              var embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(charName + ' has done event ' + eventData.payload.event_name)
                .setTimestamp()

              var zone = 0;
              switch (eventData.payload.zone_id) {
                case '8':
                  zone = 'Esamir';
                  break;
                case '6':
                  zone = 'Amerish';
                  break;
                case '4':
                  zone = 'Hossin';
                  break;
                case '2':
                  zone = 'Indar';
                  break;
                }

              embed.addField('Continent', zone, true);
              if (eventData.payload.event_name == 'Death') {
                if (charIsTracked) {
                  embed.setTitle(charName + ' has been killed');
                  let attackerCharName = await getNameByID(eventData.payload.attacker_character_id);
                  embed.addField('Attacker',  attackerCharName, true);
                }
                else {
                  embed.setTitle(charName + ' has gotten a kill');
                  let victimCharName = await getNameByID(eventData.payload.character_id);
                  embed.addField('Victim', victimCharName, true);
                }
                let attackerVehicleName = (eventData.payload.attacker_vehicle_id === '0') ? '0' : await getVehicleNameByID(eventData.payload.attacker_vehicle_id);
                embed.addField('Attacker Vehicle', attackerVehicleName, true);
                let attackerLoadoutName = await getLoadoutNameByID(eventData.payload.attacker_loadout_id);
                embed.addField('Attacker Loadout', attackerLoadoutName, true);
                let victimLoadoutName = await getLoadoutNameByID(eventData.payload.character_loadout_id);
                embed.addField('Victim Loadout', victimLoadoutName, true);
              }
              else if (eventData.payload.event_name == 'GainExperience' || eventData.payload.event_name == 'GainExperience_experience_id_1') {
                let loadoutName = await getLoadoutNameByID(eventData.payload.loadout_id);
                embed.addField('Loadout', loadoutName, true);
								let expName =  await getExpNameByID(eventData.payload.experience_id);
                embed.addField('Experience Type', expName, true);
								let otherCharName = (eventData.payload.other_id === '0') ? '0' : (await getNameByID(eventData.payload.other_id));
                embed.addField('Other Character',  otherCharName, true);
                if (eventData.payload.experience_id == 1) {
                  embed.setTitle(charName + ' has gotten a kill');
                }
                else if (eventData.payload.experience_id == 2) {
                  embed.setTitle(charName + ' has gotten an assist');
				          embed.addField('Exp Earned', event.payload.amount, true);
                }
              }
              else if (eventData.payload.event_name == 'VehicleDestroy') {
                let attackerVehicleName = eventData.payload.attacker_vehicle_id;
                let victimVehicleName = eventData.payload.vehicle_id;
                if (charIsTracked) {
                  embed.setTitle(charName + '\'s vehicle was destroyed');
                  let attackerCharName = await getNameByID(eventData.payload.attacker_character_id);
                  embed.addField('Attacker', attackerCharName, true);
                }
                else {
                  embed.setTitle(charName + ' destroyed a vehicle');
                  let victimCharName = await getNameByID(eventData.payload.character_id);
                  embed.addField('Victim', victimCharName, true);
                }
                attackerVehicleName = (attackerVehicleName === '0') ? '0' : await getVehicleNameByID(attackerVehicleName);
                victimVehicleName = await getVehicleNameByID(victimVehicleName);
                embed.addField('Attacker Vehicle', attackerVehicleName, true);
                embed.addField('Victim Vehicle', victimVehicleName, true);
              }
              else if (eventData.payload.event_name == 'PlayerFacilityCapture' || eventData.payload.event_name == 'PlayerFacilityDefend') {
                let facilityName = await getFacilityNameByID(eventData.payload.facility_id);
                embed.addField('Facility', facilityName, true);
              }
              else if (eventData.payload.event_name == 'PlayerLogin' || eventData.payload.event_name == 'PlayerLogout') {
                //
              }
              msg.channel.send(embed);
            }
  				}
  			}
        msg.channel.send("Connected");
      }, 1000);
    }
    else if (msg.content.substring(0,10) === '!subscribe') {
      if (msg.content.substring(11) === 'all') {
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["Death"]}'); // Kills & Death
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["VehicleDestroy"]}'); // Vehicles
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerFacilityCapture"]}'); // Base Cap
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerFacilityDefend"]}'); // Base Def
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerLogin"]}'); // Log in
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerLogout"]}'); // Log out
        msg.channel.send('Subscribed to all events');
      }
      else if (msg.content.substring(11,17) === 'deaths') {
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["Death"]}');
        msg.channel.send('Subscribed to kill and death events');
      }
      else if (msg.content.substring(11,14) === 'exp') {
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["GainExperience"]}');
        msg.channel.send('Subscribed to exp events');
      }
      else if (msg.content.substring(11,19) === 'vehicles') {
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["VehicleDestroy"]}');
        msg.channel.send('Subscribed to vehicle events');
      }
      else if (msg.content.substring(11,15) === 'base') {
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerFacilityCapture"]}');
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerFacilityDefend"]}');
        msg.channel.send('Subscribed to base events');
      }
      else if (msg.content.substring(11,14) === 'log') {
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerLogin"]}');
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerLogout"]}');
        msg.channel.send('Subscribed to log events');
      }
    }
		else if (msg.content === '!unsubscribe') {
			socket.send('{"service":"event","action":"clearSubscribe","all":"true"}');
			msg.channel.send('Unsubscribed from all events');
		}
		else if (msg.content.substring(0,4) === '!add') {
			console.log('Adding ' + msg.content.substring(5));
			let newCharacter = await getCharacterByName(msg.content.substring(5));
			let newJSONObject = { "tracking": tracking };
			newJSONObject.tracking[tracking.length] = newCharacter.character_id;
			fs.writeFileSync('tracker.json', JSON.stringify(newJSONObject), function (err) { if (err) throw err; });
			updateTrackingInfo();
			msg.channel.send('Now tracking ' + msg.content.substring(5));
		}
		else if (msg.content.substring(0,7) === '!remove') {
			console.log('Removing ' + msg.content.substring(8));
			let newTracking = [];
			for (let i=0; i<tracking.length; i++) {
				let currentName = await getNameByID(tracking[i]);
				if (currentName.toLowerCase() !== msg.content.substring(8).toLowerCase()) {
					newTracking[newTracking.length] = tracking[i];
				}
			}
			let newJSONObject = { "tracking": newTracking };
			fs.writeFileSync('tracker.json', JSON.stringify(newJSONObject), function (err) { if (err) throw err; });
			updateTrackingInfo();
			msg.channel.send('No longer tracking ' + msg.content.substring(8));
		}
		else if (msg.content === '!online') {
			// https://census.daybreakgames.com/s:personnnnnnnnnnnnnisbotting/get/ps2/characters_online_status?character_id=5428620138827674865
			var embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Online status of tracked characters:')
				.setTimestamp()
			for (let i=0; i<tracking.length; i++) {
				let charName = await getNameByID(tracking[i]);
				let online = (await getOnlineStatusByID(tracking[i]) == 1) ? 'Online' : 'Offline';
				embed.addField(charName, online, true);
			}
			msg.channel.send(embed);
		}
		else if (msg.content === '!help') {
			var embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Commands')
				.setTimestamp()
			embed.addField('!connect', 'Creates websocket connection to the Streaming API (required for realtime tracking).', true);
			embed.addField('!subscribe <event type>', 'Subscribes to certain streaming events for all tracked characters. Options are deaths, exp, vehicles, base, log, or all.', true);
			embed.addField('!unsubscribe', 'Unsubscribes from all streaming events for all tracked characters.', true);
			embed.addField('!add <character name>', 'Adds a new character to the list of tracked characters, by name (case insensitive).', true);
			embed.addField('!remove <character name>', 'Removes a character from the list of tracked characters, by name (case insensitive).', true);
			embed.addField('!online', 'Provides the online status of all tracked characters.', true);
			embed.addField('!help', 'You already know what this does.', true);
			msg.channel.send(embed);
		}
    else if (msg.content.substring(0,8) === '!vehicle') {
      let vehicleName = await getVehicleNameByID(msg.content.substring(9));
      msg.channel.send(vehicleName);
    }
  }
});

async function getNameByID(charID) {
	if (players0.includes(charID)) {
		return players[players0.indexOf(charID)][1];
	}
	else {
		let character = await getCharacterByID(charID);
		let arrayToAdd = [charID, character.name.first];
		cache.players[cache.players.length] = arrayToAdd;
		await updatedCache();
		return players[players0.indexOf(charID)][1];
	}
}

async function getExpNameByID(expID) {
	if (exp0.includes(expID)) {
		return exp[exp0.indexOf(expID)][1];
	}
	else {
		let expEvent = await getExpByID(expID);
		let arrayToAdd = [expID, expEvent.description];
		cache.expTypes[cache.expTypes.length] = arrayToAdd;
		await updatedCache();
		return exp[exp0.indexOf(expID)][1];
	}
}

async function getLoadoutNameByID(loadoutID) {
	if (loadout0.includes(loadoutID)) {
		return loadout[loadout0.indexOf(loadoutID)][1];
	}
	else {
		let loadoutEvent = await getLoadoutByID(loadoutID);
		let arrayToAdd = [loadoutID, loadoutEvent.code_name];
		cache.loadoutTypes[cache.loadoutTypes.length] = arrayToAdd;
		await updatedCache();
		return loadout[loadout0.indexOf(loadoutID)][1];
	}
}

async function getFacilityNameByID(facilityID) {
	if (facility0.includes(facilityID)) {
		return facility[facility0.indexOf(facilityID)][1];
	}
	else {
		let facilityEvent = await getFacilityByID(facilityID);
		let arrayToAdd = [facilityID, facilityEvent.facility_name];
		cache.facilities[cache.facilities.length] = arrayToAdd;
		await updatedCache();
		return facility[facility0.indexOf(facilityID)][1];
	}
}

async function getVehicleNameByID(vehicleID) {
	if (vehicles0.includes(vehicleID)) {
		return vehicles[vehicles0.indexOf(vehicleID)][1];
	}
	else {
		let vehicle = await getVehicleByID(vehicleID);
		let arrayToAdd = [vehicleID, vehicle.name.en];
		cache.vehicles[cache.vehicles.length] = arrayToAdd;
		await updatedCache();
		return vehicles[vehicles0.indexOf(vehicleID)][1];
	}
}

async function getExpByID(id) {
	let result = await requestFromCensusAPI(serviceID + '/get/ps2:v2/experience?experience_id=' + id);
	return result.experience_list[0];
}

async function getCharacterByName(name) {
	let result = await requestFromCensusAPI(serviceID + '/get/ps2:v2/character/?name.first_lower=' + name.toLowerCase());
	return result.character_list[0];
}

async function getCharacterByID(id) {
	let result = await requestFromCensusAPI(serviceID + '/get/ps2:v2/character/?character_id=' + id);
	return result.character_list[0];
}

async function getOnlineStatusByID(id) {
	let result = await requestFromCensusAPI(serviceID + '/get/ps2/characters_online_status/?character_id=' + id);
	return result.characters_online_status_list[0].online_status;
}

async function getLoadoutByID(id) {
  let result = await requestFromCensusAPI(serviceID + '/get/ps2:v2/loadout/?loadout_id=' + id);
  return result.loadout_list[0];
}

async function getFacilityByID(id) {
  let result = await requestFromCensusAPI(serviceID + '/get/ps2:v2/map_region/?facility_id=' + id);
  return result.map_region_list[0];
}

async function getVehicleByID(id) {
  let result = await requestFromCensusAPI(serviceID + '/get/ps2:v2/vehicle/?vehicle_id=' + id);
  return result.vehicle_list[0];
}

function requestFromCensusAPI(path) {
	return new Promise(resolve => {
		const options = {
			host: 'census.daybreakgames.com',
			path: path
		};
		const callback = function(response) {
			let str = '';
			let output = {};
			response.on('data', function (chunk) {
				str += chunk;
			});
			response.on('end', function () {
				output = JSON.parse(str);
				resolve(output);
			});
		}

		let req = http.request(options, callback).end();
	});
}
