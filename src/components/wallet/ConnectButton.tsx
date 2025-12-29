import { ConnectButton as SuiConnectButton } from '@mysten/dapp-kit';

export default function ConnectButton() {
  return (
    <SuiConnectButton
      className="!bg-indigo-500 hover:!bg-indigo-600 !text-white !font-medium !rounded-xl !px-4 !py-2 !transition-colors"
    />
  );
}
