import Head from "next/head";
import { useEffect, useState } from "react";
import cutString from "../functions/CutString";
import { ethers } from "ethers";
import myEpicNft from "../contracts/utils/MyEpicNFT.json";
import { useRouter } from "next/router";
import MoonLoader from "react-spinners/MoonLoader";

export default function Home() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [OpenSeaLink, setOpenSeaLink] = useState("");
  const [openWalletMenu, setOpenWalletMenu] = useState(false);
  const [nbNftsMinted, setNbNftsMinted] = useState(0);
  const [loadMinting, setLoadMinting] = useState(false);

  const CONTRACT_ADDRESS = "0x8feF55a7A06d7994eA37fCf33F718c3A1eeEE049";

  const checkWalletConnected = async () => {
    if (typeof window !== "undefined") {
      const { ethereum } = window;
      if (!ethereum) {
        console.warn("Please install MetaMask");
        setIsWalletConnected(false);
      } else {
        console.log("MetaMask is installed: ", ethereum);
        const accounts = await ethereum.request({ method: "eth_accounts" });

        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account);
          setIsWalletConnected(true);
          // Setup listener! This is for the case where a user comes to our site
          // and ALREADY had their wallet connected + authorized.
          setupEventListener();
        } else {
          console.log("No authorized account found");
          setCurrentAccount("");
        }
      }
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  const disconnectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      await ethereum.request({
        method: "wallet_requestPermissions",
        params: [
          {
            eth_accounts: {},
          },
        ],
      });

      setCurrentAccount("");
    } catch (error) {
      console.log(error);
    }
  };

  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;
      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          console.log("New Epic NFT Minted!");
          setOpenSeaLink(
            `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNFT = async () => {
    setLoadMinting(true);
    setTransactionHash("");
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.");
        await nftTxn.wait();

        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        setTransactionHash(nftTxn.hash);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
      setLoadMinting(false);
    } catch (error) {
      console.log(error);
      setLoadMinting(false);
    }
  };

  useEffect(() => {
    const getNbNFTsMinted = async () => {
      try {
        const { ethereum } = window;

        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const connectedContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            myEpicNft.abi,
            signer
          );

          let nb_minted = await connectedContract.getNbTokensMinted();
          setNbNftsMinted(nb_minted.toNumber());

          console.log("Mining nb_minted...please wait.");
        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error);
      }
    };

    getNbNFTsMinted();
  }, []);

  useEffect(() => {
    checkWalletConnected();
  }, []);

  useEffect(() => {
    const checkNetworkConnected = async () => {
      try {
        const { ethereum } = window;

        if (ethereum) {
          let chainId = await ethereum.request({ method: "eth_chainId" });
          console.log("Connected to chain " + chainId);

          // String, hex code of the chainId of the Rinkebey test network
          const rinkebyChainId = "0x4";
          if (chainId !== rinkebyChainId) {
            alert("You are not connected to the Rinkeby Test Network!");
          }
        }
      } catch (e) {
        console.log(e);
      }
    };
    checkNetworkConnected();
  }, []);

  return (
    <div>
      <Head>
        <title>NFT Collection</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-gray-900 w-full h-screen">
        <header className="w-full h-14 p-2 bg-gray-700 grid grid-cols-3 ">
          <div></div>
          <div></div>
          <div className="flex justify-end">
            {!isWalletConnected && !currentAccount ? (
              <button
                onClick={() => {
                  connectWallet();
                }}
                className="px-4 py-2 w-[15em] bg-gradient-to-t rounded-md from-[#03B6D4] to-[#3D82F6] text-white font-bold  "
              >
                Connect your wallet
              </button>
            ) : (
              <div className=" relative">
                <button
                  onClick={() => {
                    setOpenWalletMenu(!openWalletMenu);
                  }}
                  className="relative px-4 py-2 w-[15em] bg-gradient-to-t rounded-md from-[#03B6D4] to-[#3D82F6] text-white font-bold  "
                >
                  {cutString(20, currentAccount)}
                </button>
                {openWalletMenu && (
                  <div className="absolute p-2 rounded font-semibold bg-white top-14  w-full">
                    <button
                      onClick={() => {
                        disconnectWallet();
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <section className="w-full space-y-4 flex flex-col  items-center justify-center p-4 ">
          {currentAccount && (
            <button
              onClick={async () => {
                await askContractToMintNFT();
              }}
              className="px-4 py-2 bg-gradient-to-t rounded-md from-[#03B6D4] to-[#3D82F6] text-white font-bold  "
            >
              Mint NFT
            </button>
          )}
          <MoonLoader
            color={"#26A4E0"}
            loading={loadMinting}
            css={`
              display: block;
              margin: 0 auto;
              border-color: #26A4E0;
            `}
            size={50}
          />
          {transactionHash && OpenSeaLink && (
            <div className=" space-y-4 flex-col flex">
              <a
                href={OpenSeaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-center bg-gradient-to-t rounded-md from-[#03B6D4] to-[#3D82F6] text-white font-bold  "
              >
                View on OpenSea
              </a>

              <a
                href={"https://rinkeby.etherscan.io/tx/" + transactionHash}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2  bg-gradient-to-t rounded-md from-[#03B6D4] to-[#3D82F6] text-white font-bold  "
              >
                View transaction on EtherScan
              </a>
            </div>
          )}
          {nbNftsMinted ? (
            <span className="text-white font-semibold text-3xl">
              {nbNftsMinted} already minted !
            </span>
          ) : null}
        </section>
      </main>

      <footer></footer>
    </div>
  );
}
