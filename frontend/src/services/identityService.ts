import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fixia-production.up.railway.app';

export interface IdentityDocument {
  type: 'front' | 'back';
  url: string;
  name: string;
}

export interface VerificationStatus {
  is_verified: boolean;
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  verified_at: string | null;
  submitted_at: string | null;
  document_type: string | null;
  has_documents: boolean;
  notes: string | null;
  rejection_reason: string | null;
}

export interface VerificationHistory {
  estado: string;
  fecha_solicitud: string;
  fecha_actualizacion: string | null;
  notas: string | null;
}

export interface VerificationResponse {
  verification: VerificationStatus;
  history: VerificationHistory[];
}

export interface PendingVerification {
  user_id: string;
  email: string;
  user_type: string;
  full_name: string;
  submitted_at: string;
  document_type: string;
  notes: string | null;
  documents: IdentityDocument[];
}

class IdentityService {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private getAuthHeaders() {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Upload document file and get file ID
   */
  async uploadDocument(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'identity_verification');

      const response = await axios.post(
        `${API_URL}/api/upload/single`,
        formData,
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        return response.data.data.file.id;
      } else {
        throw new Error(response.data.error || 'Error uploading file');
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      throw new Error(error.response?.data?.error || 'Error uploading document');
    }
  }

  /**
   * Submit identity verification documents
   */
  async submitDocuments(data: {
    document_type: string;
    document_front_file: File;
    document_back_file?: File;
    notes?: string;
  }): Promise<void> {
    try {
      // Upload front document
      const frontFileId = await this.uploadDocument(data.document_front_file);
      
      // Upload back document if provided
      let backFileId: string | undefined;
      if (data.document_back_file) {
        backFileId = await this.uploadDocument(data.document_back_file);
      }

      // Submit verification request
      const response = await axios.post(
        `${API_URL}/api/identity/submit-documents`,
        {
          document_type: data.document_type,
          document_front_file_id: frontFileId,
          document_back_file_id: backFileId,
          notes: data.notes,
        },
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error submitting documents');
      }
    } catch (error: any) {
      console.error('Error submitting documents:', error);
      throw new Error(error.response?.data?.error || 'Error submitting documents');
    }
  }

  /**
   * Get user's identity verification status
   */
  async getVerificationStatus(): Promise<VerificationResponse> {
    try {
      const response = await axios.get(
        `${API_URL}/api/identity/status`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Error fetching verification status');
      }
    } catch (error: any) {
      console.error('Error fetching verification status:', error);
      
      // Return default status if API is not available
      return {
        verification: {
          is_verified: false,
          status: 'not_started',
          verified_at: null,
          submitted_at: null,
          document_type: null,
          has_documents: false,
          notes: null,
          rejection_reason: null,
        },
        history: [],
      };
    }
  }

  /**
   * Update verification status (Admin only)
   */
  async updateVerificationStatus(data: {
    user_id: string;
    status: 'approved' | 'rejected' | 'pending';
    notes?: string;
    rejection_reason?: string;
  }): Promise<void> {
    try {
      const response = await axios.put(
        `${API_URL}/api/identity/update-status`,
        data,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error updating verification status');
      }
    } catch (error: any) {
      console.error('Error updating verification status:', error);
      throw new Error(error.response?.data?.error || 'Error updating verification status');
    }
  }

  /**
   * Get pending verifications for admin review
   */
  async getPendingVerifications(): Promise<PendingVerification[]> {
    try {
      const response = await axios.get(
        `${API_URL}/api/identity/pending`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (response.data.success) {
        return response.data.data.pending_verifications;
      } else {
        throw new Error(response.data.error || 'Error fetching pending verifications');
      }
    } catch (error: any) {
      console.error('Error fetching pending verifications:', error);
      throw new Error(error.response?.data?.error || 'Error fetching pending verifications');
    }
  }

  /**
   * Check if user has permission to access admin features
   */
  async checkAdminPermissions(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${API_URL}/api/identity/pending`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.status === 200;
    } catch (error: any) {
      return false;
    }
  }
}

export const identityService = new IdentityService();