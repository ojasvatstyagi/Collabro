import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, File } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Button from '../ui/Button';
import { projectsApi, ProjectFile } from '../../services/api/projects';

const FilesTab: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId]);

  const loadFiles = async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const res = await projectsApi.getProjectFiles(projectId);
      if (res.success && res.data) {
        setFiles(res.data);
      }
    } catch (err) {
      console.error('Failed to load files', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !projectId) return;

    const file = e.target.files[0];
    try {
      setIsUploading(true);
      const res = await projectsApi.uploadFile(projectId, file);
      if (res.success && res.data) {
        setFiles([res.data, ...files]);
      }
    } catch (err) {
      console.error('Failed to upload file', err);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await projectsApi.deleteFile(fileId);
      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error('Failed to delete file', err);
    }
  };

  const handleDownload = (fileId: string, _: string) => {
    window.open(projectsApi.getDownloadUrl(fileId), '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-dark dark:text-gray-100">
          Project Files
        </h3>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            leftIcon={
              isUploading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Upload className="h-4 w-4" />
              )
            }
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
        </div>
      ) : files.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-brand-dark-lighter dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Size</th>
                  <th className="px-6 py-3 font-medium">Uploaded By</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {file.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {file.uploadedByAvatar ? (
                          <img
                            src={file.uploadedByAvatar}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs dark:bg-gray-700">
                            {file.uploadedByName?.charAt(0)}
                          </div>
                        )}
                        <span className="text-gray-600 dark:text-gray-300">
                          {file.uploadedByName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(file.id, file.fileName)}
                          className="p-1 text-gray-400 hover:text-brand-orange transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
          <div className="rounded-full bg-gray-100 p-4 mb-4 dark:bg-gray-800">
            <File className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            No files yet
          </p>
          <p className="max-w-sm text-sm">
            Upload documents, images, or other files to share with your team.
          </p>
        </div>
      )}
    </div>
  );
};

export default FilesTab;
