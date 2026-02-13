import React, { useRef } from 'react';
import { vscode } from './utils/vscode';
function App() {
    const fileInputRef = useRef(null);
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                vscode.postMessage({
                    type: 'uploadDiagram',
                    data: {
                        name: file.name,
                        content: reader.result
                    }
                });
            };
            reader.readAsText(file);
        }
    };
    return (React.createElement(React.StrictMode, null,
        React.createElement("div", { className: "container" },
            React.createElement("input", { ref: fileInputRef, type: "file", style: { display: 'none' }, onChange: handleFileChange }),
            React.createElement("button", { onClick: handleUploadClick, className: "upload-button" }, "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B"))));
}
export default App;
