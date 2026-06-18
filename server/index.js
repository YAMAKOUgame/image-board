const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

if(!fs.existsSync("./uploads")){
  fs.mkdirSync("./uploads");
}

app.use(cors());

app.use(
  "/uploads",
  express.static(
    path.join(__dirname,"uploads")
  )
);


const storage = multer.diskStorage({

  destination:(req,file,cb)=>{
    cb(null,path.join(__dirname,"uploads"));
  },

  filename:(req,file,cb)=>{
    cb(
      null,
      Date.now()+"-"+file.originalname
    );
  }

});


const upload = multer({storage});


const server = http.createServer(app);


const io = new Server(server,{
  cors:{
    origin:"*"
  }
});


const saveFile = path.join(
  __dirname,
  "fieldCards.json"
);


let fieldCards = {};


if(fs.existsSync(saveFile)){

  fieldCards = JSON.parse(
    fs.readFileSync(
      saveFile,
      "utf8"
    )
  );

}
app.post(
  "/upload",
  upload.single("image"),
  (req,res)=>{
    if(!req.file){
      return res.status(400).json({
        error:"画像なし"
      });
    }
    const image =
      fs.readFileSync(req.file.path)
      .toString("base64");
    res.json({

      url:
      "data:"+
      req.file.mimetype+
      ";base64,"+
      image
    });
  }
);

io.on("connection",(socket)=>{
  console.log("接続しました");
  // 接続した人へ現在状態送信
  socket.emit(
    "sync",
    fieldCards
  );
  socket.on(
  "updateField",
  data=>{
    console.log("受信:", data);
    fieldCards = {
      ...data
    };


    fs.writeFileSync(
      saveFile,
      JSON.stringify(fieldCards)
    );


    socket.broadcast.emit(
      "sync",
      fieldCards
    );


    socket.emit(
      "sync",
      fieldCards
    );

  }
);

});


const PORT =
process.env.PORT || 3001;
server.listen(
  PORT,
  ()=>{
    console.log(
      "server running :" + PORT
    );
  }
);