import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://image-board-nvzh.onrender.com");

function App() {
  const [fieldCards, setFieldCards] = useState({});
  const [myCards, setMyCards] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [draggedSlot, setDraggedSlot] = useState(null);
  const [handOpen, setHandOpen] = useState(true);
  const [stockOpen, setStockOpen] = useState(true);
  const [trashOpen, setTrashOpen] = useState(true);
  useEffect(() => {

  socket.on("connect", () => {
    console.log("server接続成功");
  });


  socket.on("sync", (data) => {
  setFieldCards(data);
});


  return () => {
    socket.off("connect");
    socket.off("sync");
  };

}, []);

const handleImageSelect = async (slotId,event)=>{

  const file = event.target.files[0];

  if(!file) return;


  const formData = new FormData();

  formData.append(
    "image",
    file
  );


  const res = await fetch(
  "https://image-board-nvzh.onrender.com/upload",
    {
      method:"POST",
      body:formData
    }
  );


  const data = await res.json();


  const imageUrl = data.url;

    console.log(imageUrl);

  if(slotId.startsWith("field")){

    const next = {
  ...fieldCards,
  [slotId]:imageUrl
};

setFieldCards(next);

socket.emit(
  "updateField",
  next
);
  }else{
    setMyCards(prev=>({
      ...prev,
      [slotId]:imageUrl
    }));
  }
};
  const deleteCard = slotId => {
    if (slotId.startsWith("field")) {
      setFieldCards(prev => {
        const next = { ...prev };
        delete next[slotId];
        socket.emit(
  "updateField",
  next
);
        return next;
      });
    } else if(slotId.startsWith("trash")){

  setMyCards(prev=>{

    const next = {...prev};

    delete next[slotId];

    return next;

  });


  setFieldCards(prev=>{

    const next = {...prev};

    delete next[slotId];

    return next;

  });

}
else{

  setMyCards(prev=>{

    const next = {...prev};

    delete next[slotId];

    return next;

  });

}
  };

  const moveToTrash = slotId => {

  const image =
    fieldCards[slotId] || myCards[slotId];


  if(!image) return;


  const target =
    Array.from({length:20})
    .map((_,i)=>`trash${i}`)
    .find(slot =>
      !fieldCards[slot] &&
      !myCards[slot]
    );


  if(!target) return;


  if(slotId.startsWith("field")){

  setFieldCards(prev=>{

    const next = {
      ...prev,
      [target]:image
    };

    delete next[slotId];


    socket.emit(
      "updateField",
      next
    );

    return next;

  });

  }else{

    setMyCards(prev=>{

      const next = {
        ...prev,
        [target]:image
      };

      delete next[slotId];

      return next;

    });

  }

};

const drawCard = () => {

  const stockSlots =
    Object.keys(myCards)
      .filter(key => key.startsWith("stock"))
      .filter(key => myCards[key]);


  if(stockSlots.length === 0){
    return;
  }


  const randomSlot =
    stockSlots[
      Math.floor(Math.random() * stockSlots.length)
    ];


  const image =
    myCards[randomSlot];


  const handSlots =
    Array.from({length:10})
    .map((_,i)=>`hand${i}`)
    .filter(slot => !myCards[slot]);


  if(handSlots.length === 0){
    return;
  }


  const target =
    handSlots[0];


  setMyCards(prev=>{

    const next = {
      ...prev,
      [target]: image
    };

    delete next[randomSlot];


    return next;

  });

};

  const handleDrop = targetSlot => {

  if (!draggedSlot || draggedSlot === targetSlot) return;


  const sourceImage =
    fieldCards[draggedSlot] || myCards[draggedSlot];


  const sourceIsField =
    draggedSlot.startsWith("field");

  const targetIsField =
    targetSlot.startsWith("field");


  // 左 → 左
  if(sourceIsField && targetIsField){

    setFieldCards(prev => {

      const next = {...prev};

      delete next[draggedSlot];

      next[targetSlot] = sourceImage;


      socket.emit(
        "updateField",
        next
      );


      return next;

    });

  }


  // 左 → 右
  else if(sourceIsField && !targetIsField){


    setFieldCards(prev => {

      const next = {...prev};

      delete next[draggedSlot];


      socket.emit(
        "updateField",
        next
      );


      return next;

    });


    setMyCards(prev => ({
      ...prev,
      [targetSlot]: sourceImage
    }));

  }


  // 右 → 左
  else if(!sourceIsField && targetIsField){


  setMyCards(prev => {

    const next = {...prev};

    delete next[draggedSlot];

    return next;

  });


  setFieldCards(prev=>{

    const nextField = {
      ...prev,
      [targetSlot]: sourceImage
    };


    socket.emit(
      "updateField",
      nextField
    );


    return nextField;

  });

}


  // 右 → 右
  else {


    setMyCards(prev => {

      const next = {...prev};

      delete next[draggedSlot];

      next[targetSlot] = sourceImage;

      return next;

    });

  }

  setDraggedSlot(null);

};

  const renderCard = slotId => {

  const image =
    fieldCards[slotId] || myCards[slotId];

  const isField = slotId.startsWith("field");


    return (
      <>
        <input
          type="file"
          accept="image/*"
          id={slotId}
          style={{ display:"none" }}
          onChange={e => handleImageSelect(slotId, e)}
        />

        <div
          style={{ width:"100%", height:"100%" }}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(slotId)}
        >
          {image ? (
  <div style={{
    width:"100%",
    height:"100%",
    position:"relative",
    display:"flex",
    flexDirection:"column"
  }}>
              <img
                src={image}
                draggable
                onDragStart={() => setDraggedSlot(slotId)}
                onClick={() => setSelectedImage(image)}
                style={{
                  width:"100%",
                  height:"85%",
                  objectFit:"cover",
                  borderRadius:"6px",
                  cursor:"grab"
                }}
              />

              <div style={{
  position:"absolute",
  left:"4px",
  bottom:"4px",
  display:"flex",
  gap:"4px"
}}>

<button
  onClick={e => {
    e.stopPropagation();
    deleteCard(slotId);
  }}
  style={{
    fontSize:"9px",
    padding:"1px 5px"
  }}
>
  削除
</button>


<button
  onClick={e => {
    e.stopPropagation();

    moveToTrash(slotId);

  }}
  style={{
    fontSize:"12px",
    padding:"3px 8px"
  }}
>
  トラッシュ
</button>

</div>
            </div>
          ) : (
            <label
              htmlFor={slotId}
              style={{
                width:"100%",
                height:"100%",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                cursor:"pointer",
                color:"#888",
                fontSize:"28px"
              }}
            >
              ＋
            </label>
          )}
        </div>
      </>
    );
  };

  const cardStyle = {
    aspectRatio:"944 / 1313",
    width:"100%",
    border:"2px solid black",
    backgroundColor:"white",
    borderRadius:"8px",
    overflow:"hidden"
  };

  return (
    <>
      <div style={{
        display:"flex",
        height:"100vh"
      }}>
        <div style={{
          flex:1,
          background:"#d9eef8",
          padding:"20px",
          overflowY:"auto"
        }}>
          <h2>対戦フィールド</h2>

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(3,1fr)",
            gap:"12px"
          }}>
            {[1,2,3].map(i =>
  <div
    key={i}
    style={{
      width:"80%"
    }}
  >

    <div style={cardStyle}>
      {renderCard(`field${i}`)}
    </div>

    <div style={{
  display:"flex",
  flexDirection:"column",
  gap:"4px",
  marginTop:"6px"
}}>

  <div style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center"
  }}>
    <span>エネ</span>
    <input style={{width:"60px"}} />
  </div>

  <div style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center"
  }}>
    <span>HP</span>
    <input style={{width:"60px"}} />
  </div>

  <div style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center"
  }}>
    <span>状態</span>
    <input style={{width:"60px"}} />
  </div>

</div>

  </div>
)}
          </div>

          <div style={{
  display:"flex",
  flexDirection:"column",
  alignItems:"center",
  gap:"20px",
  margin:"20px auto"
}}>

{/* 上段 4 + 追加右 */}
<div style={{
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  gap:"12px",
  width:"65%"
}}>

  {/* 4 */}
  <div style={{width:"100%"}}>

    <div style={cardStyle}>
      {renderCard("field4")}
    </div>

    <div style={{
      display:"flex",
      flexDirection:"column",
      gap:"4px",
      marginTop:"6px"
    }}>

      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span>エネ</span>
        <input style={{width:"60px"}} />
      </div>

      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span>HP</span>
        <input style={{width:"60px"}} />
      </div>

      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span>状態</span>
        <input style={{width:"60px"}} />
      </div>

    </div>

  </div>


  {/* 追加枠 */}
  <div style={{
    ...cardStyle,
    width:"50%"
  }}>
    {renderCard("field9")}
  </div>

</div>



{/* 下段 追加左 + 5 */}
<div style={{
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  gap:"12px",
  width:"65%"
}}>


  {/* 追加枠 */}
  <div style={{
    ...cardStyle,
    width:"50%"
  }}>
    {renderCard("field10")}
  </div>


  {/* 5 */}
  <div style={{width:"100%"}}>

    <div style={cardStyle}>
      {renderCard("field5")}
    </div>


    <div style={{
      display:"flex",
      flexDirection:"column",
      gap:"4px",
      marginTop:"6px"
    }}>

      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span>エネ</span>
        <input style={{width:"60px"}} />
      </div>

      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span>HP</span>
        <input style={{width:"60px"}} />
      </div>

      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span>状態</span>
        <input style={{width:"60px"}} />
      </div>

    </div>

  </div>

</div>

</div>

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(3,1fr)",
            gap:"12px"
          }}>
            {[6,7,8].map(i =>
              <div
    key={i}
    style={{
      width:"80%"
    }}
  >

    <div style={cardStyle}>
      {renderCard(`field${i}`)}
    </div>

    <div style={{
  display:"flex",
  flexDirection:"column",
  gap:"4px",
  marginTop:"6px"
}}>

  <div style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center"
  }}>
    <span>エネ</span>
    <input style={{width:"60px"}} />
  </div>

  <div style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center"
  }}>
    <span>HP</span>
    <input style={{width:"60px"}} />
  </div>

  <div style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center"
  }}>
    <span>状態</span>
    <input style={{width:"60px"}} />
  </div>

</div>

  </div>
)}
          </div>
        </div>

        <div style={{
          flex:1,
          background:"#f4e3d8",
          padding:"20px",
          overflowY:"auto"
        }}>
          <h2>手札/山札</h2>
          <h3>手札</h3>

{handOpen && (
<div style={{
  display:"grid",
  gridTemplateColumns:"repeat(5,1fr)",
  gap:"12px"
}}>
            {Array.from({length:10}).map((_,i) =>
              <div key={i} style={cardStyle}>
                {renderCard(`hand${i}`)}
              </div>
            )}
          </div>
)}
          <h3
 onClick={() => setStockOpen(!stockOpen)}
 style={{cursor:"pointer"}}
>
 山札 {stockOpen ? "▲" : "▼"}
</h3>

<button onClick={drawCard}>
 山札を引く
</button>

{stockOpen && (

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(5,1fr)",
            gap:"12px"
          }}>
            {Array.from({length:20}).map((_,i)=>
              <div key={i} style={cardStyle}>
                {renderCard(`stock${i}`)}
              </div>
            )}
          </div>
          )}
          <h3
  onClick={() => setTrashOpen(!trashOpen)}
  style={{cursor:"pointer"}}
>
  トラッシュ {trashOpen ? "▲" : "▼"}
</h3>

{trashOpen && (
  <div style={{
    display:"grid",
    gridTemplateColumns:"repeat(5,1fr)",
    gap:"12px"
  }}>
    {Array.from({length:20}).map((_,i)=>
      <div key={i} style={cardStyle}>
        {renderCard(`trash${i}`)}
      </div>
    )}
  </div>
)}
        </div>
      </div>

      {selectedImage &&
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position:"fixed",
            inset:0,
            background:"rgba(0,0,0,0.75)",
            display:"flex",
            alignItems:"center",
            justifyContent:"center"
          }}
        >
          <img
            src={selectedImage}
            style={{
              maxWidth:"85vw",
              maxHeight:"85vh"
            }}
          />
        </div>
      }
    </>
  );
}

export default App;