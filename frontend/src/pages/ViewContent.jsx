import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Download, Clock, Eye, FileText, AlertTriangle, Lock as LockIcon, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { getContent, deleteContent } from '../services/api';
import { copyToClipboard, formatDate, getTimeRemaining, formatFileSize, getFileIcon } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const ViewContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Password protection
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async (pwd = null) => {
    try {
      setLoading(true);
      setPasswordSubmitting(true);
      const response = await getContent(id, pwd);
      if (response.success) {
        setContent(response.data);
        setRequiresPassword(false);
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 401 && data?.requiresPassword) {
        setRequiresPassword(true);
        setLoading(false);
        if (pwd) {
          setAlert({ type: 'error', message: 'Incorrect password' });
        }
      } else if (status === 404) {
        setError({ title: 'Not Found', message: 'Content does not exist', icon: AlertTriangle });
      } else if (status === 410) {
        setError({ title: 'Expired', message: data?.message || 'Content has expired', icon: Clock });
      } else {
        setError({ title: 'Error', message: 'Failed to load', icon: AlertTriangle });
      }
    } finally {
      setLoading(false);
      setPasswordSubmitting(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setAlert({ type: 'error', message: 'Please enter password' });
      return;
    }
    fetchContent(password);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await deleteContent(id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Content deleted successfully' });
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete content' });
    }
  };

  const handleCopyText = async () => {
    const success = await copyToClipboard(content.textContent);
    if (success) {
      setCopied(true);
      setAlert({ type: 'success', message: 'Text copied!' });
      setTimeout(() => { setCopied(false); setAlert(null); }, 3000);
    }
  };

  const handleDownload = () => {
    window.open(content.downloadUrl, '_blank');
  };

  // Password prompt screen
  if (requiresPassword) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 p-4 rounded-full">
                <LockIcon className="w-12 h-12 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Required</h2>
            <p className="text-gray-600">This content is password protected</p>
          </div>

          {alert && (
            <div className="mb-6">
              <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                disabled={passwordSubmitting}
              />
            </div>
            <Button type="submit" variant="primary" fullWidth loading={passwordSubmitting}>
              {passwordSubmitting ? 'Verifying...' : 'Unlock Content'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    const ErrorIcon = error.icon;
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <ErrorIcon className="w-16 h-16 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{error.title}</h2>
            <p className="text-gray-600 mb-8">{error.message}</p>
            <Button onClick={() => navigate('/')} variant="primary">Go Home</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (content && content.type === 'text') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">Text Content</h2>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopyText} variant={copied ? 'success' : 'secondary'}>
                <Copy className="w-4 h-4" />{copied ? 'Copied!' : 'Copy'}
              </Button>
              {content.canDelete && isAuthenticated && (
                <Button onClick={handleDelete} variant="secondary">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              )}
            </div>
          </div>

          {alert && <div className="mb-6"><Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} /></div>}

          {/* Feature badges */}
          {(content.isOneTimeView || content.maxViews) && (
            <div className="flex gap-2 mb-4">
              {content.isOneTimeView && (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full">
                  <Eye className="w-3 h-3" />One-time view
                </span>
              )}
              {content.maxViews && (
                <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  Max {content.maxViews} views
                </span>
              )}
            </div>
          )}

          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">{content.textContent}</pre>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Eye className="w-3 h-3" />Views</p>
              <p className="font-semibold text-gray-800">{content.viewCount}{content.maxViews ? `/${content.maxViews}` : ''}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Expires</p>
              <p className="font-semibold text-gray-800">{getTimeRemaining(content.expiresAt)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Created</p>
              <p className="font-semibold text-gray-800 text-sm">{formatDate(content.createdAt)}</p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">This content will be deleted on {formatDate(content.expiresAt)}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (content && content.type === 'file') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-6 rounded-full text-5xl">{getFileIcon(content.mimeType)}</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">File Ready</h2>

            {/* Feature badges */}
            {(content.isOneTimeView || content.maxViews) && (
              <div className="flex gap-2 justify-center mt-4">
                {content.isOneTimeView && (
                  <span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full">
                    <Eye className="w-3 h-3" />One-time download
                  </span>
                )}
                {content.maxViews && (
                  <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                    Max {content.maxViews} downloads
                  </span>
                )}
              </div>
            )}
          </div>

          {alert && <div className="mb-6"><Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} /></div>}

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-1">File Name</p>
            <p className="font-semibold text-gray-800">{content.fileName}</p>
            <p className="text-sm text-gray-600 mt-2">Size: {formatFileSize(content.fileSize)}</p>
          </div>

          <div className="flex gap-2 mb-6">
            <Button onClick={handleDownload} variant="primary" fullWidth>
              <Download className="w-5 h-5" />Download File
            </Button>
            {content.canDelete && isAuthenticated && (
              <Button onClick={handleDelete} variant="secondary">
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Eye className="w-3 h-3" />Downloads</p>
              <p className="font-semibold text-gray-800">{content.viewCount}{content.maxViews ? `/${content.maxViews}` : ''}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Expires</p>
              <p className="font-semibold text-gray-800">{getTimeRemaining(content.expiresAt)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Uploaded</p>
              <p className="font-semibold text-gray-800 text-sm">{formatDate(content.createdAt)}</p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800"><strong>Note:</strong> File will be deleted on {formatDate(content.expiresAt)}. Download before it expires!</p>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default ViewContent;