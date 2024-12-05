/*global chrome*/
import { WindowPostMessageStream } from '@metamask/post-message-stream';

const CONTENT_SCRIPT = 'qubetics-contentscript';
const INPAGE = 'qubetics-inpage';

const setupPageStreams = () => {
  const pageStream = new WindowPostMessageStream({
    name: CONTENT_SCRIPT,
    target: INPAGE,
  });

  let lastId = null;

  const chainId = localStorage.getItem('qubetics_chain_id');
  console.log(
    '🚀 ~ file: contentscript.js:16 ~ setupPageStreams ~ chainId:',
    chainId
  );
  chrome.runtime.sendMessage({ type: 'SWITCH_CHAIN', payload: { chainId } });

  pageStream.on('data', async (data) => {
    console.log('🚀 ~ file: contentscript.js:50 ~ pageStream.on ~ data:', data);

    if (data.name) {
      if (lastId == data.id) {
        return console.log('Request already under process.u');
      }
      lastId = data.id;
      console.log('Please wait starting to resolve.');
      const finalResponse = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'JSON-RPC', payload: { ...data, method: data.name } },
          (response) => {
            console.log('🚀 ~ file: contentscript.js:50 ~ pageStream.on ~ response', response);
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else if (response && response.type === 'JSON-RPC') {
              resolve(response.payload);    console.log('🚀 ~ file: contentscript.js:50 ~ pageStream.on ~ data:', data);
            } else {
              reject(new Error('Invalid response received'));
            }
          }
        );
      });

      if (finalResponse) {
        const responseToSend = {
          ...finalResponse,
        };

        console.log(finalResponse, 'OUTGOING_RESPONSE');

        pageStream.write(responseToSend);
        lastId = null;
      }
    }
  });
};

const initStreams = () => {
  setupPageStreams();
};

const start = () => {
  initStreams();
};

start();
