import React, {
  useEffect,
  useState,
  MouseEventHandler,
  createContext,
  useContext,
} from "react";
import { createRoot } from "react-dom/client";
import { Button, Modal, Radio, Divider, Tooltip } from "antd";
import { radioOptions } from "./constans";
console.log("加载context脚1");

const MyContext = React.createContext<ContextValue>({} as ContextValue);

interface Coords {
  x?: number;
  y?: number;
  visible?: boolean;
}

type panelProps = {
  selectionStr: string | undefined;
  str: string | undefined;
  type: string;
};

interface ContextValue {
  editBtnCoords: Coords;
  setEditBtnCoords: React.Dispatch<React.SetStateAction<Coords>>;
  editPanelCoords: Coords;
  setEditPanelCoords: React.Dispatch<React.SetStateAction<Coords>>;
  editPanelProps: panelProps;
  setEditPanelProps: React.Dispatch<React.SetStateAction<panelProps>>;
}

var lastSelectionRange: Range | undefined; 

const resetSelectionRange = () => {
  // 当需要重新选择最后一次选中的内容时
  const selection = window.getSelection();
  if(selection && lastSelectionRange){
    selection.removeAllRanges();
    selection.addRange(lastSelectionRange);
  }
}

const EditBtn: React.FC = () => {
  // 在需要更新坐标时调用 onCoordsChange
  const {
    editBtnCoords,
    setEditBtnCoords,
    editPanelCoords,
    setEditPanelCoords,
    editPanelProps,
    setEditPanelProps,
  } = useContext(MyContext);


  const handleButtonClick: MouseEventHandler<HTMLImageElement> = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setEditBtnCoords((state) => ({ ...state, visible: false }));
    setEditPanelCoords((state) => ({ ...state, visible: true }));
    // resetSelectionRange()
    const message = {
      action: "editing",
      word: editPanelProps.selectionStr,
      type: editPanelProps.type,
    };
    console.log("sendMessage ", message);

    chrome.runtime.sendMessage(message, function (f) { });
  };

  const icon = chrome.runtime.getURL("icon.png");

  return (
    <div
      style={{
        position: "absolute",
        top: editBtnCoords.y,
        left: editBtnCoords.x,
        display: editBtnCoords.visible ? "block" : "none",
        zIndex: 10000,
      }}
    >
      <Tooltip title='文本润色'>
        <img
          src={icon}
          alt=""
          onMouseUp={handleButtonClick}
          style={{
            cursor: "pointer",
            border:0,
            width: 32,
            height: 32,
          }}
        />
      </Tooltip>

    </div>
  );
};

const EditType: React.FC = () => {
  const {
    editBtnCoords,
    setEditBtnCoords,
    editPanelCoords,
    setEditPanelCoords,
    editPanelProps,
    setEditPanelProps,
  } = useContext(MyContext);
  const onChange = (e: any) => {
    e.preventDefault();
    console.log("radio checked", e.target.value);
    setEditPanelProps((state) => ({ ...state, type: e.target.value }));

    const message = {
      action: "editing",
      word: editPanelProps.selectionStr,
      type: e.target.value,
    };
    console.log("sendMessage ", message);

    chrome.runtime.sendMessage(message, function (f) { });
  };

  return (
    <>
      模式：
      <Radio.Group
        onChange={onChange}
        defaultValue={editPanelProps.type}
        value={editPanelProps.type}
        size="small"
        buttonStyle="solid"
      >
        {radioOptions.map((option) => (
          <Tooltip title={option.tip} key={option.value}>
            <Radio.Button value={option.value}>
              {option.label}
            </Radio.Button>
          </Tooltip>
        ))}
      </Radio.Group>
    </>
  );
};

const EditPanel: React.FC = () => {
  const {
    editBtnCoords,
    setEditBtnCoords,
    editPanelCoords,
    setEditPanelCoords,
    editPanelProps,
    setEditPanelProps,
  } = useContext(MyContext);

  const handleContainerClick = (event: any) => {
    event.stopPropagation();
  };
  const handleCancel = () => {
    setEditBtnCoords((state) => ({ ...state, visible: false }));
    setEditPanelCoords((state) => ({ ...state, visible: false }));
  };
  return (
    <div onMouseUp={handleContainerClick}>
      <Modal
        title={<EditType />}
        style={{
          zIndex: 10001,
          position: "absolute",
          top: editPanelCoords.y,
          left: editPanelCoords.x,
          textAlign:'left'
        }}
        mask={false}
        open={editPanelCoords.visible}
        onCancel={() => handleCancel()}
        footer={null}
      >
        <hr />
        <p style={{ whiteSpace: "pre-line", minHeight: 80, marginTop: 10, fontSize: '14px' }}>
          {editPanelProps.str}
        </p>
      </Modal>
    </div>
  );
};

function getSelection(): Promise<string | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(window.getSelection()?.toString());
    }, 0);
  });
}

const App = () => {
  const [editBtnCoords, setEditBtnCoords] = useState<Coords>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [editPanelCoords, setEditPanelCoords] = useState<Coords>({
    x: 0,
    y: 0,
    visible: false,
  });

  const [editPanelProps, setEditPanelProps] = useState<panelProps>({
    selectionStr: "",
    str: "",
    type: radioOptions[0].value,
  });

  useEffect(() => {
    const handleEditingMessage = (message: any) => {
      // console.log("message", message);
      if (message.type === "editing") {
        const text = message.data;
        setEditPanelProps((prevCoords) => ({ ...prevCoords, str: text }));
      }
    };
    chrome.runtime.onMessage.addListener(handleEditingMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleEditingMessage);
    };
  }, []);

  useEffect(() => {
    const handleMouseUp = async (event: MouseEvent) => {
      const text = await getSelection();

      if (text !== "" && editPanelProps.selectionStr !== text) {
        console.log("selectionStr", editPanelProps.selectionStr);
        console.log("text", text);
        setEditPanelProps((prevCoords) => ({
          ...prevCoords,
          selectionStr: text,
        }));

        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        lastSelectionRange = range;
        const rect = range?.getBoundingClientRect() || {
          left: 0,
          width: 0,
          bottom: 0,
        };
        const buttonLeft = event.clientX + window.scrollX;
        const buttonTop = event.clientY + window.scrollY;

        const panelLeft = rect.left;
        const panelTop = rect.bottom + 10;

        console.log("buttonLeft", buttonLeft);
        console.log("buttonTop", buttonTop);
        console.log("panelLeft", panelLeft);
        console.log("panelTop", panelTop);

        setEditBtnCoords({ x: buttonLeft, y: buttonTop, visible: true });
        setEditPanelCoords({ x: panelLeft, y: panelTop, visible: false });
      } else {
        console.log("hide  text", text);
        setEditBtnCoords({ x: 0, y: 0, visible: false });
        setEditPanelCoords({ x: 0, y: 0, visible: false });
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <MyContext.Provider
      value={{
        editBtnCoords,
        setEditBtnCoords,
        editPanelCoords,
        setEditPanelCoords,
        editPanelProps,
        setEditPanelProps,
      }}
    >
      <EditBtn />
      <EditPanel />
    </MyContext.Provider>
  );
};


const rootElement = document.createElement("div");
document.body.appendChild(rootElement);
const root = createRoot(rootElement);
root.render(<App />);