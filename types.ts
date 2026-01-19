
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Artifact {
  id: string;
  styleName: string;
  imageUrl: string;
  status: 'processing' | 'complete' | 'error';
}

export interface Session {
    id: string;
    productImageBase64: string;
    timestamp: number;
    artifacts: Artifact[];
}

export interface ProductStyle {
    id: string;
    name: string;
    prompt: string;
    icon: string;
}
