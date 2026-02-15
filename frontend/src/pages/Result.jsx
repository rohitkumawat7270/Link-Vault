import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link2, Copy, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { copyToClipboard, formatDate, getTimeRemaining } from '../utils/helpers';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [alert, setAlert] = useState(null);

  const data = location.state?.data;

  React.useEffect(() => {
    if (!data) navigate('/');
  }, [data, navigate]);

  if (!data) return null;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(data.url);
    if (success) {
      setCopied(true);
      setAlert({ type: 'success', message: 'Link copied to clipboard!' });
      setTimeout(() => { setCopied(false); setAlert(null); }, 3000);
    } else {
      setAlert({ type: 'error', message: 'Failed to copy link' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Upload Successful! 🎉</h2>
          <p className="text-gray-600">Your {data.type} has been uploaded and is ready to share</p>
        </div>

        {alert && (
          <div className="mb-6">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4" />Your Shareable Link
          </label>
          <div className="flex gap-2">
            <input type="text" value={data.url} readOnly className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 font-mono text-sm" />
            <Button onClick={handleCopyLink} variant={copied ? 'success' : 'secondary'} className="whitespace-nowrap">
              {copied ? <><CheckCircle className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Content Type</p>
            <p className="font-semibold text-gray-800 capitalize">{data.type}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Expires In</p>
            <p className="font-semibold text-gray-800">{data.expiresIn}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">Expires At</p>
            <p className="font-semibold text-gray-800">{formatDate(data.expiresAt)}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate(`/view/${data.contentId}`)} variant="primary" fullWidth>
            <ExternalLink className="w-4 h-4" />View Content
          </Button>
          <Button onClick={() => navigate('/')} variant="secondary" fullWidth>Upload Another</Button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800"><strong>Important:</strong> Save this link! Once you leave this page, you won't be able to retrieve it. The content will be permanently deleted after {getTimeRemaining(data.expiresAt).toLowerCase()}.</p>
        </div>
      </Card>
    </div>
  );
};

export default Result;