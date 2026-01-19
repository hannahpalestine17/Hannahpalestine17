
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Artifact } from '../types';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    onClick: () => void;
}

const ArtifactCard = React.memo(({ 
    artifact, 
    isFocused, 
    onClick 
}: ArtifactCardProps) => {
    const isProcessing = artifact.status === 'processing';

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = artifact.imageUrl;
        link.download = `foto-produk-${artifact.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isProcessing ? 'generating' : ''}`}
            onClick={onClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">{artifact.styleName}</span>
                {artifact.status === 'complete' && isFocused && (
                    <button className="download-btn-mini" onClick={handleDownload}>
                        Unduh
                    </button>
                )}
            </div>
            <div className="artifact-card-inner">
                {isProcessing ? (
                    <div className="generating-overlay-photo">
                        <div className="shimmer-box"></div>
                        <div className="processing-text">AI sedang mempercantik foto...</div>
                    </div>
                ) : (
                    <img 
                        src={artifact.imageUrl} 
                        alt={artifact.styleName}
                        className="artifact-image-display"
                    />
                )}
            </div>
        </div>
    );
});

export default ArtifactCard;
