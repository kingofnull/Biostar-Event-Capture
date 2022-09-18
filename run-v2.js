const Moment= require('moment-timezone');
const Config=require('./config');
console.log('Runing Config:',Config);

// process.exit();



const SERVER_URL=`${Config.secure_connection?'https':'http'}://${Config.server}`;

const WebSocket = require('ws');
const sql = require('mssql');
const axios = require('axios');

async function insertEvent(event){
	
	try{
		let shortDate=event.datetime.split("T").shift().replace(/[^\d]/g,"");
		let shortTime=event.datetime.split("T").pop().split(".").shift().replace(/[^\d]/g,"");
		let device_id=event.device_id.id;
		let user_id=event.user_id.user_id;
		let user_name=event.user_id.name || "-";
		console.log('shortDate',shortDate);
		console.log('shortTime',shortTime);
		console.log('device_id',device_id);
		console.log('user_id',user_id);
		console.log('user_name',user_name);
		
		device_id=Config.device_id_map[device_id]
		//shortTime=new Date(event.datetime).toLocaleTimeString('en-IR').replace(/[^\d]/g,"");
		shortTime=Moment("2024-07-13T06:52:31.00Z").tz(Config.timezone,true).format("HHmmss");
		console.log('shortTime',shortTime);
		
		// let query="INSERT tEnter(C_Date,C_Time,L_TID,L_UID,C_Name,C_Unique,REQUEST_DUMP) VALUES(@shortDate,@shortTime,@device_id,@user_id,@user_name,@user_id,@dump)";
		let query="INSERT tEnter(C_Date,L_TID,L_UID,C_Name,C_Unique,REQUEST_DUMP) VALUES(@shortDate,@device_id,@user_id,@user_name,@user_id,@dump)";
		// console.log('query',query,device_id!=542341302);
		/* if(device_id!=542341302){
			return;
		} */
		console.dir(event);
		await sql.connect(Config.torget_connection_str)
		const request = new sql.Request();
		request.input('shortDate', shortDate);
		request.input('shortTime', shortTime);
		request.input('device_id', device_id);
		request.input('user_id', user_id);
		request.input('user_name', user_name);
		request.input('dump', JSON.stringify(event, null, '\t'));
		// const result = await sql.query(query);
		const result = await request.query(query);
		console.dir(result);
		
	}catch(err){
		console.error(err.message);
	}
	
	
}
/* 
let sampleEvent={
       "id": "0",
       "event_type_id": {
           "code": "4867",
           "name": "IDENTIFY_SUCCESS_FACE",
           "description": "",
           "enable_alert": "false",
           "alertable": "false",
           "alert_name": "",
           "alert_message": ""
       },
       "index": "642091",
       "datetime": "2024-07-13T09:18:31.00Z",
       "server_datetime": "2022-07-13T13:48:33.00Z",
       "device_id": {
           "id": "542341360",
           "name": "FaceStation 2 542341360 (172.20.44.40)"
       },
       "user_id": {
           "user_id": "5053064",
           "name": "ياسر شيوافرد",
           "photo_exists": "false"
       },
       "tna_key": "0",
       "parameter": "-1",
       "image_id": {
           "image_data": "1657703911_542341360_642091",
           "image_type": "JPG"
       }
   };
 
insertEvent( sampleEvent).catch(error => console.log(error));; */
// process.exit();
 
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

(async function(){
	let socket = null;
	let login_str=`{"User":{"login_id":"admin","password":"admin"}}`;
	const res = await axios.post(`${SERVER_URL}/api/login`, login_str, {
	  headers: {
		// 'bs-session-key': SESSION_KEY
	  }
	});

	if(res.status!=200){
		console.error("login failed!",res);	
		return;
	}
	
	let sessionId=res.headers['bs-session-id'];
	console.log('sessionId:',sessionId);
	
	
	
	socket=new WebSocket(`${Config.secure_connection?'wss':'ws'}://${Config.server}/wsapi`);
	socket.onopen = async function(e) {
	  console.log("[open] Connection established");
	  console.log("Sending sessionId to server...");
	  socket.send("bs-session-id="+sessionId);
	  
	  const res = await axios.post(`${SERVER_URL}/api/events/start`, "", {
		  headers: {
			'bs-session-id': sessionId
		  }
		});
		
		if(res.status!=200){
			console.error("Starting events failed!",res);	
			process.exit();
		}
		
		console.log("Starting events succeed!");	
		
	};
	
	socket.onmessage =async  function(event) {
		console.log(`[message] Data received from server: ${event.data}`);
		try{
			let data=JSON.parse(event.data);
			let eventName=data?.Event?.event_type_id?.name;
			console.log('Event:',eventName);
			if(eventName=="IDENTIFY_SUCCESS_FACE"){
				insertEvent(data.Event);
			}
			/* 
			
			 */
		}catch(err){
			console.error(err);
		}

	};

	socket.onclose = function(event) {
	  if (event.wasClean) {
		console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
	  } else {
		// e.g. server process killed or network down
		// event.code is usually 1006 in this case
		console.log('[close] Connection died');
	  }
	};

	socket.onerror = function(error) {
	  console.log(`[error] ${error.message}`);
	};
	
})();





