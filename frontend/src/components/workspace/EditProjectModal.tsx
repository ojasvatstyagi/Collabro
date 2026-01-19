import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import {
  Project,
  UpdateProjectRequest,
  projectsApi,
} from '../../services/api/projects';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdate: (updatedProject: Project) => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<UpdateProjectRequest>({});
  const [technologies, setTechnologies] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        title: project.title,
        description: project.description,
        category: project.category,
        technologies: project.technologies,
        level: project.level as any,
        duration: project.duration,
        teamSize: project.teamSize,
        budget: project.budget,
        isRemote: project.isRemote,
        isOpenSource: project.isOpenSource,
        contactMethod: project.contactMethod,
        additionalInfo: project.additionalInfo,
        status: project.status,
      });
      setTechnologies(project.technologies.join(', '));
    }
  }, [isOpen, project]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        technologies: technologies
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await projectsApi.updateProject(project.id, payload);
      if (res.success && res.data) {
        onUpdate(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to update project', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project Details">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <Input
          label="Project Title"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:bg-brand-dark-lighter dark:border-gray-600 dark:text-white"
            rows={4}
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:bg-brand-dark-lighter dark:border-gray-600 dark:text-white"
              value={formData.category || ''}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {[
                'Technology',
                'Design',
                'Marketing',
                'Business',
                'Finance',
                'Education',
                'Health',
                'Other',
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:bg-brand-dark-lighter dark:border-gray-600 dark:text-white"
              value={formData.status || 'ACTIVE'}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <Input
          label="Technologies (comma separated)"
          value={technologies}
          onChange={(e) => setTechnologies(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duration"
            value={formData.duration || ''}
            onChange={(e) =>
              setFormData({ ...formData, duration: e.target.value })
            }
          />
          <Input
            label="Budget"
            value={formData.budget || ''}
            onChange={(e) =>
              setFormData({ ...formData, budget: e.target.value })
            }
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditProjectModal;
