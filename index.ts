import { Contract, FixedNumber, providers, Wallet } from 'ethers';
import { abi as multicallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json';
import { abi as IERC20Minimal } from '@uniswap/v3-core/artifacts/contracts/interfaces/IERC20Minimal.sol/IERC20Minimal.json';

const TOKEN = '0xab167E816E4d76089119900e941BEfdfA37d6b32';
const TOKEN_DECIMALS = 9;
const MULTICALL = '0x1f98415757620b543a52e61c46b32eb19261f984';
const ADDRESS = '0x88C2edf8A4aF0E71b0155443C0eA2da13c5aB7F4';

const provider = providers.InfuraProvider.getWebSocketProvider(
  1,
  // process.env.INFURA_API_KEY,
);

const signer = Wallet.createRandom().connect(provider);

async function main() {
  const token = new Contract(TOKEN, IERC20Minimal, signer);
  const multicall = new Contract(MULTICALL, multicallABI, signer);

  try {
    const balanceOf = token.interface.getFunction('balanceOf');
    const callData = token.interface.encodeFunctionData(balanceOf, [ADDRESS]);
    const gasLimit = 200_000;

    console.log(`token address: ${TOKEN}`);
    console.log(`encode balanceOf(account: ${ADDRESS})`);
    console.log(`callData: ${callData}`);
    console.log('\n');

    console.log(
      [
        'multicall.callStatic.multicall(calls: [[',
        `  target: ${TOKEN},`,
        `  gasLimit: ${gasLimit},`,
        `  callData: ${callData}`,
        ']])',
      ].join('\n'),
    );
    console.log('\n');

    const [blockNumber, [[success, gasUsed, returnData]]] =
      await multicall.callStatic.multicall([[TOKEN, gasLimit, callData]]);

    console.log('Response:', {
      blockNumber: FixedNumber.fromValue(blockNumber).toString(),
      returnData: [
        {
          success,
          gasUsed: FixedNumber.fromValue(gasUsed).toString(),
          returnData: FixedNumber.fromValue(
            returnData,
            TOKEN_DECIMALS,
          ).toString(),
        },
      ],
    });
  } catch (err) {
    console.log(err);
  }

  await provider.destroy();
}

main();
