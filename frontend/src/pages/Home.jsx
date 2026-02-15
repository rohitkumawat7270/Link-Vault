import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, Type, Clock, Lock as LockIcon, Eye, Hash } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { uploadText, uploadFile } from '../services/api';
import { formatFileSize } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryMinutes, setExpiryMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alert, setAlert] = useState(null);

  // NEW FEATURES
  const [password, setPassword] = useState('');
  const [isOneTimeView, setIsOneTimeView] = useState(false);
  const [maxViews, setMaxViews] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        showAlert('error', 'File size exceeds 50MB limit');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab === 'text' && !textContent.trim()) {
      showAlert('error', 'Please enter some text content');
      return;
    }
    
    if (activeTab === 'file' && !selectedFile) {
      showAlert('error', 'Please select a file to upload');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const options = {};
      if (password) options.password = password;
      if (isOneTimeView) options.isOneTimeView = true;
      if (maxViews) options.maxViews = parseInt(maxViews);

      let response;
      
      if (activeTab === 'text') {
        response = await uploadText(textContent, expiryMinutes, options);
      } else {
        response = await uploadFile(selectedFile, expiryMinutes, options, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        });
      }

      if (response.success) {
        navigate('/result', { state: { data: response.data } });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload. Please try again.';
      showAlert('error', message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Share Content Securely</h2>
          <p className="text-gray-600">Upload text or files with advanced security options</p>
        </div>

        {alert && (
          <div className="mb-6">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'text' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Type className="w-5 h-5" />Text
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'file' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileUp className="w-5 h-5" />File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Text Content</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your text here..."
                className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none font-mono text-sm"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-2">{textContent.length} characters</p>
            </div>
          )}

          {activeTab === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-all">
                <input type="file" onChange={handleFileSelect} className="hidden" id="file-input" disabled={loading} />
                <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center">
                  <FileUp className="w-12 h-12 text-gray-400 mb-3" />
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-gray-700 font-medium">{selectedFile.name}</p>
                      <p className="text-gray-500 text-sm mt-1">{formatFileSize(selectedFile.size)}</p>
                      <p className="text-purple-600 text-sm mt-2">Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-medium mb-1">Click to select a file</p>
                      <p className="text-gray-500 text-sm">Maximum file size: 50MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />Expiry Time
            </label>
            <select
              value={expiryMinutes}
              onChange={(e) => setExpiryMinutes(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              disabled={loading}
            >
              <option value={10}>10 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={180}>3 hours</option>
              <option value={360}>6 hours</option>
              <option value={720}>12 hours</option>
              <option value={1440}>24 hours</option>
            </select>
          </div>

          {/* ADVANCED OPTIONS */}
          <div className="border-t pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700 mb-4"
            >
              <span>{showAdvanced ? '▼' : '▶'} Advanced Security Options</span>
            </button>

            {showAdvanced && (
              <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                {/* Password Protection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <LockIcon className="w-4 h-4" />Password Protection (Optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave empty for no password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Viewers will need this password to access content</p>
                </div>

                {/* One-Time View */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="oneTimeView"
                    checked={isOneTimeView}
                    onChange={(e) => setIsOneTimeView(e.target.checked)}
                    className="mt-1"
                    disabled={loading}
                  />
                  <div>
                    <label htmlFor="oneTimeView" className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
                      <Eye className="w-4 h-4" />One-Time View
                    </label>
                    <p className="text-xs text-gray-500">Content will be deleted after first view</p>
                  </div>
                </div>

                {/* Max Views */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />Maximum View Count (Optional)
                  </label>
                  <input
                    type="number"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    disabled={loading || isOneTimeView}
                  />
                  <p className="text-xs text-gray-500 mt-1">Content will be deleted after this many views</p>
                </div>
              </div>
            )}
          </div>

          {loading && uploadProgress > 0 && activeTab === 'file' && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
            {loading ? 'Uploading...' : 'Generate Secure Link'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your content will be automatically deleted after the selected expiry time. 
            {isAuthenticated && ' You can view and manage all your uploads in the Dashboard.'}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Home;