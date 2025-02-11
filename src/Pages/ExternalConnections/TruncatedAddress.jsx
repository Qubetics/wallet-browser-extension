import { message } from 'antd';
import CopyIcon from '../../Assets/CopyIcon.svg';

const TruncatedAddress = ({ address }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 7)}.....${addr.substring(addr.length - 7)}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    messageApi.success('Address Copied');
  };

  return (
    <div
      onClick={copyToClipboard}
      className='setPassword__secretPharse__copyField'
    >
      {contextHolder}
      <span>{truncateAddress(address)}</span>
      <span className='copy-icon'>
        <img className='copy-icon' src={CopyIcon} height={14} width={16} alt='Copy Icon' />
      </span>
    </div>
  );
};

export default TruncatedAddress;
