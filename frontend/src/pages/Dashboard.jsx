import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, File, Trash2, Eye, Clock, Lock, Hash, ExternalLink } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { getMyUploads, deleteContent } from '../services/api';
import { formatDate, getTimeRemaining, formatFileSize } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await getMyUploads();
      if (response.success) {
        setUploads(response.data);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load uploads' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await deleteContent(contentId);
      if (response.success) {
        setAlert({ type: 'success', message: 'Content deleted successfully' });
        setUploads(uploads.filter(u => u.contentId !== contentId));
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete content' });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-purple-100">Welcome back, {user?.username}!</p>
      </div>

      {alert && (
        <div className="mb-6">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Uploads</h2>
          <Link to="/">
            <Button variant="primary">New Upload</Button>
          </Link>
        </div>

        {uploads.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No uploads yet</p>
            <Link to="/">
              <Button variant="primary">Create Your First Upload</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {uploads.map((upload) => (
              <div key={upload.contentId} className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${upload.type === 'text' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      {upload.type === 'text' ? (
                        <FileText className="w-6 h-6 text-blue-600" />
                      ) : (
                        <File className="w-6 h-6 text-purple-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {upload.type === 'text' ? 'Text Content' : upload.fileName}
                        </h3>
                        {upload.password && (
                          <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            <Lock className="w-3 h-3" />Password
                          </span>
                        )}
                        {upload.isOneTimeView && (
                          <span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            <Eye className="w-3 h-3" />One-time
                          </span>
                        )}
                        {upload.maxViews && (
                          <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            <Hash className="w-3 h-3" />Max {upload.maxViews}
                          </span>
                        )}
                      </div>

                      {upload.type === 'text' && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {upload.textContent.substring(0, 150)}...
                        </p>
                      )}

                      {upload.type === 'file' && (
                        <p className="text-sm text-gray-600 mb-2">
                          {formatFileSize(upload.fileSize)} • {upload.mimeType}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {upload.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(upload.expiresAt)}
                        </span>
                        <span>Created {formatDate(upload.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/view/${upload.contentId}`} target="_blank">
                      <Button variant="secondary">
                        <ExternalLink className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    <Button variant="secondary" onClick={() => handleDelete(upload.contentId)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Uploads</p>
              <p className="text-2xl font-bold text-gray-800">{uploads.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-800">
                {uploads.reduce((sum, u) => sum + u.viewCount, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Protected</p>
              <p className="text-2xl font-bold text-gray-800">
                {uploads.filter(u => u.password).length}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;