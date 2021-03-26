const Discord = require('discord.js');
const bot = new Discord.Client();
// const TOKEN = process.env.TOKEN;
const TOKEN = "NzQzMTkwMTU4MTMxNTkzMzg5.XzRDxQ.biMw9DNxBDvHSlzEviovSRIqATM";

const WebSocket = require('ws');

// const PlanetsideWrapper = require("planetside-stream-api");
// const constants = require("planetside-stream-api/lib/constants");
// const api = new PlanetsideWrapper(constants.SERVERS.PC, "example");

const hardID = 743189713229316096;
const softID = 743231547494367273;

var tracking = [
	["5428620138827674865","PERSONNNNNNNNNNNNN"]
];
var tracking0 = [];
var tracking1 = "[";
for (var i = 0; i < tracking.length; i++) {
  tracking0[i] = tracking[i][0];
  tracking1 += '"' + tracking[i][0] + '"';
  if (i < tracking.length-1) {
    tracking1 += ',';
  }
}
tracking1 += ']';

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', msg => {
  if (msg.channel.id == hardID) { // Responds in Hard Focus
    if (msg.content === 'ping') {
      msg.channel.send('pong');
    }
    else if (msg.content === '!connect') {
      socket = new WebSocket("wss://push.planetside2.com/streaming?environment=ps2&service-id=s:example");
      setTimeout(function() {
        socket.send('{"action":"echo","payload":{"test":"test"},"service":"event"}');
        socket.onmessage = function(event) {
          eventData = JSON.parse(event.data);
          console.log(eventData);
  				if (eventData.type != "heartbeat" && eventData.type != "serviceStateChanged" && eventData.payload) {
            if (tracking0.includes(eventData.payload.character_id)) {
              msg.channel.send(eventData);
              console.log(eventData);
              var embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(tracking[tracking0.indexOf(eventData.payload.character_id)][1] + ' has done event ' + eventData.payload.event_name)
                .setDescription('Go get \'em')
                .setTimestamp()

              var zone = 0;
              switch (eventData.payload.zone_id) {
                case 8:
                  zone = 'Esamir';
                  break;
                case 6:
                  zone = 'Amerish';
                  break;
                case 4:
                  zone = 'Hossin';
                  break;
                case 2:
                  zone = 'Indar';
                  break;
                }

              embed.addField('Continent', zone, true);
              if (eventData.payload.event_name == 'Death') {
                embed.addField('Vehicle ID', eventData.payload.vehicle_id, true);
                embed.addField('Loadout ID', eventData.payload.loadout_id, true);
              }
              else if (eventData.payload.event_name == 'GainExperience' || eventData.payload.event_name == 'GainExperience_experience_id_1') {
                embed.addField('Loadout ID', eventData.payload.loadout_id, true);
                embed.addField('Experience ID', eventData.payload.experience_id, true);
                embed.addField('Other ID', eventData.payload.other_id, true);
                if (eventData.payload.experience_id == 1) {
                  embed.setTitle(tracking[tracking0.indexOf(eventData.payload.character_id)][1] + ' has gotten a kill');
                }
                else if (eventData.payload.experience_id == 2) {
                  embed.setTitle(tracking[tracking0.indexOf(eventData.payload.character_id)][1]+ ' has been kill-stolen');
                }
              }
              else if (eventData.payload.event_name == 'PlayerFacilityCapture' || eventData.payload.event_name == 'PlayerFacilityDefend') {
                embed.addField('Facility ID', eventData.payload.facility_id, true);
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
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["GainExperience_experience_id_1"]}'); // Kill
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["GainExperience_experience_id_2"]}'); // Assist
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["Death"]}'); // Death
        // socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["GainExperience"]}'); // Exp
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerFacilityCapture"]}'); // Base Cap
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerFacilityDefend"]}'); // Base Def
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerLogin"]}'); // Log in
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["PlayerLogout"]}'); // Log out
        msg.channel.send('Subscribed to all events');
      }
      else if (msg.content.substring(11,16) === 'kills') {
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["GainExperience_experience_id_1"]}');
        msg.channel.send('Subscribed to kill events');
      }
      else if (msg.content.substring(11,17) === 'deaths') {
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["Death"]}');
        msg.channel.send('Subscribed to death events');
      }
      else if (msg.content.substring(11,14) === 'exp') {
        socket.send('{"service":"event","action":"subscribe","characters":'+tracking1+',"eventNames":["GainExperience"]}');
        msg.channel.send('Subscribed to exp events');
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
  }
});

// api.on("open", () => {
//     console.log("Connected to Census!");
//     api.subscribe(["13"], ["FacilityControl"]);
// });
