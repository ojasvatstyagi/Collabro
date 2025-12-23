import React, { useState } from "react";
import { Plus, X, Github, Linkedin, Twitter, Globe, Link } from "lucide-react";
import Button from "./Button";
import Input from "./Input";
import { cn } from "../../utils/cn";
import { SocialLink } from "../../services/api/profile";

interface SocialLinksManagerProps {
    socialLinks: SocialLink[];
    onAddLink: (platform: string, url: string) => Promise<void>;
    onRemoveLink: (linkId: string) => void;
    isEditing?: boolean;
    className?: string;
}

const SocialLinksManager: React.FC<SocialLinksManagerProps> = ({
    socialLinks,
    onAddLink,
    onRemoveLink,
    isEditing = false,
    className,
}) => {
    const [newUrl, setNewUrl] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState<string>("GITHUB");
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const platforms = ["GITHUB", "LINKEDIN", "TWITTER", "WEBSITE", "OTHER"];

    const handleAddLink = async () => {
        if (newUrl.trim()) {
            setIsLoading(true);
            try {
                await onAddLink(selectedPlatform, newUrl.trim());
                setNewUrl("");
                setIsAdding(false);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const getIcon = (platform: string) => {
        switch (platform) {
            case 'GITHUB': return <Github className="w-4 h-4" />;
            case 'LINKEDIN': return <Linkedin className="w-4 h-4" />;
            case 'TWITTER': return <Twitter className="w-4 h-4" />;
            default: return <Globe className="w-4 h-4" />;
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-brand-dark dark:text-gray-100 flex items-center">
                    <Link className="mr-2 h-5 w-5" />
                    Social Links
                </h3>
                {isEditing && !isAdding && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        leftIcon={<Plus className="h-4 w-4" />}
                    >
                        Add Link
                    </Button>
                )}
            </div>

            {isEditing && isAdding && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
                        <select
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            {platforms.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="URL API"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://..."
                    />
                    <div className="flex gap-2 justify-end">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setNewUrl("");
                                setIsAdding(false);
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAddLink}
                            disabled={!newUrl.trim() || isLoading}
                            isLoading={isLoading}
                        >
                            Add Link
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {socialLinks && socialLinks.length > 0 ? (
                    socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={cn("p-2 rounded-full text-white shrink-0",
                                    link.platform === 'GITHUB' ? "bg-black" :
                                        link.platform === 'LINKEDIN' ? "bg-blue-600" :
                                            link.platform === 'TWITTER' ? "bg-sky-500" : "bg-gray-400"
                                )}>
                                    {getIcon(link.platform)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-brand-dark dark:text-gray-200 text-sm">{link.platform}</p>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block max-w-[200px] md:max-w-xs">{link.url}</a>
                                </div>
                            </div>
                            {isEditing && (
                                <button
                                    onClick={() => link.id && onRemoveLink(link.id)}
                                    className="ml-2 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Remove link"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No social links added yet.</p>
                )}
            </div>
        </div>
    );
};

export default SocialLinksManager;
