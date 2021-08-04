const ethers = require("ethers");
const { infuraKey, mnemonic } = require("../.secrets.json");
const multicallAbi = require("./static/multicallAbi.json");

const multicallAddress = "0xC2F3ee9a51A0121c2ddE510a052fCd3243F46fBc";
const networkName = "goerli";
let contract;

// Read wallet from mnemonic
async function walletFromMnemonic(network) {
  const provider = new ethers.providers.InfuraProvider(network, infuraKey);
  let wallet = new ethers.Wallet.fromMnemonic(mnemonic);
  wallet = wallet.connect(provider);
  console.log(`Address: ${wallet.address} (${await wallet.getTransactionCount()} transactions)`);
  return wallet;
}

// Make multiple write transactions
async function makeTransaction(txs) {
  const tx = await contract.multiCall(txs);
  console.log(`Transaction sent with nonce ${tx.nonce} and hash ${tx.hash}`);
  const receipt = await tx.wait();
  if (receipt.status === 1) console.log(`Successfully included in block #${receipt.blockNumber}.`);
  else console.log(`Transaction reverted`);
}

// Make multiple read calls
async function makeCall(wallet, calls) {
  const multicallInterface = new ethers.utils.Interface([
    "function multiCall(tuple(address target, bytes callData)[] calldata calls) returns (bytes[] memory results)",
  ]);
  const multicallData = multicallInterface.encodeFunctionData("multiCall", [calls]);
  const result = await wallet.provider.call({ to: multicallAddress, data: multicallData });
  console.log(`Response: ${result}`); // TODO: this byte array needs to be decoded
}

async function main() {
  const wallet = await walletFromMnemonic(networkName);
  contract = new ethers.Contract(multicallAddress, multicallAbi, wallet);

  // Example #1: make multiple approves in one transaction - although with the contract as the owner
  const txs = [];
  const approveInterface = new ethers.utils.Interface(["function approve(address spender, uint256 amount)"]);
  const approveData = approveInterface.encodeFunctionData("approve", [
    "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 SwapRouter address. Just because needed a random safe address
    ethers.utils.parseEther("100"),
  ]);
  txs.push({ target: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C", callData: approveData }); // USDC on goerli
  txs.push({ target: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", callData: approveData }); // UNI on goerli
  await makeTransaction(txs);

  // Example #2: make multiple balanceOf calls in one transaction
  const calls = [];
  const balanceOfInterface = new ethers.utils.Interface(["function balanceOf(address account) view returns (uint256)"]);
  const balanceOfData = balanceOfInterface.encodeFunctionData("balanceOf", [wallet.address]);
  calls.push({ target: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C", callData: balanceOfData }); // USDC on goerli
  calls.push({ target: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", callData: balanceOfData }); // UNI on goerli
  await makeCall(wallet, calls);
}

main();
