import { WebBundlr } from "@bundlr-network/client";
import { useState, useRef } from "react";
import { providers, utils } from "ethers";
import BigNumber from 'bignumber.js'
import "./App.css";

function App() {
  const [bundlrInstance, setBundlrInstance] = useState();
  const [balance, setBalance] = useState();
  const bundlrRef = useRef();
  const [file, setFile] = useState();
  const [image, setImage] = useState();
  const [URI, setURI] = useState();
  const [amount, setAmount] = useState();

  async function initialiseBundlr() {
    await window.ethereum.enable();

    const provider = new providers.Web3Provider(window.ethereum);
    await provider._ready();

    const bundlr = new WebBundlr(
      "https://devnet.bundlr.network",
      "matic",
      provider, {
        providerUrl: "https://rpc-mumbai.matic.today",
    }
    );
    await bundlr.ready();

    setBundlrInstance(bundlr);
    bundlrRef.current = bundlr;
    fetchBalance();
  }

  async function initialize() {
    initialiseBundlr();
  }

  function onFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      const image = URL.createObjectURL(file);
      setImage(image);
      let reader = new FileReader();
      reader.onload = function () {
        if (reader.result) {
          setFile(Buffer.from(reader.result));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  async function uploadFile() {
    let tx = await bundlrInstance.uploader.upload(file, [
      { name: "Content-Type", value: "video/mp4" },
    ]);
    console.log("tx: ", tx);
    setURI(`http://arweave.net/${tx.data.id}`);
  }

  async function fundWallet() {
    if (!amount) return;
    const amountParsed = parseInput(amount);
    let response = await bundlrInstance.fund(amountParsed);
    console.log("Wallet funded: ", response);
    fetchBalance();
  }

  function parseInput(input) {
    const conv = new BigNumber(input).multipliedBy(
      bundlrInstance.currencyConfig.base[1]
    );
    if (conv.isLessThan(1)) {
      console.log("error: value too small");
      return;
    } else {
      return conv;
    }
  }

  async function fetchBalance() {
    const bal = await bundlrRef.current.getLoadedBalance();
    console.log("bal: ", utils.formatEther(bal.toString()));
    setBalance(utils.formatEther(bal.toString()));
  }

  return (
    <div>
      {!balance && <button onClick={initialize}>Initialize</button>}
      {balance && (
        <div>
          <h3>Balance: {balance}</h3>
          <div>
            <input onChange={(e) => setAmount(e.target.value)} />
            <button onClick={fundWallet}>Fund Wallet</button>
          </div>
          <input type="file" onChange={onFileChange} />
          <button onClick={uploadFile}>Upload File</button>
          {image && <img src={image} />}
          {URI && <a href={URI}>{URI}</a>}
        </div>
      )}
    </div>
  );
}

export default App;
