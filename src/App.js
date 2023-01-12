import { useState, useRef, useEffect } from "react";

/* ******************************** WebBundlr and ethers packages ******************************** */

import { WebBundlr } from "@bundlr-network/client";
import { providers, utils } from "ethers";
import BigNumber from "bignumber.js";
import "./App.css";

/* ******************************** Axios ******************************** */

import axios from "axios";
import FormData from "form-data";
var data = new FormData();

function App() {

 /* ******************************** useStates ******************************** */
  
  const [bundlrInstance, setBundlrInstance] = useState();
  const [balance, setBalance] = useState();
  const bundlrRef = useRef();
  const [file, setFile] = useState();
  const [image, setImage] = useState();
  const [URI, setURI] = useState();
  const [amount, setAmount] = useState();
  const [header, setHeader] = useState();

  /* ******************************** Initialise function ******************************** */

  async function initialiseBundlr() {
    await window.ethereum.enable();
    const provider = new providers.Web3Provider(window.ethereum);
    await provider._ready();

    const bundlr = new WebBundlr(
      "https://devnet.bundlr.network",
      "matic",
      provider,
      {
        providerUrl: "https://rpc-mumbai.matic.today",
      }
    );
    await bundlr.ready();

    setBundlrInstance(bundlr);
    bundlrRef.current = bundlr;
    fetchBalance();
  }


/* ******************************** uploadVideo Function ******************************** */
  let tx;
  async function uploadFile() {
    tx = await bundlrInstance.uploader.upload(
      [file],
      [{ name: "Content-Type", value: "video/mp4" }]
    );
    console.log("tx: ", tx.data.id);
    setURI(`http://arweave.net/${tx.data.id}`);
    const URL = `http://arweave.net/${tx.data.id}`;
    console.log("URI: ", URL);
    data.append("id", tx.data.id);
    data.append("url", URL);
    console.log("header:", tx.headers);
    setHeader(tx.headers);
    var config = {
      method: "post",
      url: "https://api.video.wiki/transaction/arweave/save/data/",
      headers: {
        header,
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
      });
  }

/* ******************************** fundWallet Function ******************************** */

  async function fundWallet() {
    console.log(balance)
    if (balance > 0.2) return;
    // If balance less than 0.2 then add 0.01 funds to the wallet
    const amountParsed = parseInput(0.01);
    let response = await bundlrInstance.fund(amountParsed);
    console.log("Wallet funded: ", response);
    fetchBalance();
  }

/* ******************************** parseInput function for fundWallet ******************************** */

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

/* ******************************** fetchBalance function for fundWallet and called in initialiseBundlr ******************************** */

  async function fetchBalance() {
    const bal = await bundlrRef.current.getLoadedBalance();
    console.log("bal: ", utils.formatEther(bal.toString()));
    setBalance(utils.formatEther(bal.toString()));
  }

  /* ******************************** call the fundWallet and uploadVideo Function ******************************** */
  async function initialize() {
    
    await fundWallet();
    await uploadFile();
  }

/* ******************************** useEffect for initialisation of bundlr wallet ******************************** */

  useEffect(() => {
    initialiseBundlr();
  }, []);

/* ******************************** Render ******************************** */

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files?.item(0))} />
      <button onClick={initialize}>sab karega ye button</button>
      <h3>Balance: {balance}</h3>
      {URI && <a href={URI}>{URI}</a>}
    </div>
  );
}

export default App;
