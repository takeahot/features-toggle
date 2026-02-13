import React, { useRef, useEffect, useState } from 'react';
import { vscode } from './utils/vscode';
function App() {
    const fileInputRef = useRef(null);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const handleMessage = (event) => {
            const message = event.data;
            switch (message.type) {
                case 'diagramParsed':
                    if (message.data.error) {
                        setError(message.data.error);
                        setParsedData(null);
                    }
                    else {
                        setParsedData(message.data);
                        setError(null);
                    }
                    break;
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file extension
            if (!file.name.endsWith('.drawio')) {
                vscode.postMessage({
                    type: 'error',
                    data: { message: 'Please select a .drawio file' }
                });
                return;
            }
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
