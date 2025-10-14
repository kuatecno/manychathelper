/**
 * Manychat API Client
 * Wrapper for Manychat API endpoints
 * Documentation: https://api.manychat.com/swagger
 */

const MANYCHAT_API_BASE = 'https://api.manychat.com';

export interface ManychatSubscriber {
  id: string | number;
  key?: string;
  page_id?: string | number;
  status: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  gender?: string;
  profile_pic?: string;
  locale?: string;
  language?: string;
  timezone?: string | number;
  phone?: string;
  email?: string;
  whatsapp_phone?: string;
  optin_phone?: boolean;
  optin_email?: boolean;
  optin_whatsapp?: boolean;
  opted_in_messenger?: boolean;
  opted_in_instagram?: boolean;
  opted_in_whatsapp?: boolean;
  opted_in_telegram?: boolean;
  subscribed?: string; // ISO date
  last_input_text?: string;
  last_interaction?: string;
  ig_last_interaction?: string;
  last_seen?: string;
  ig_last_seen?: string;
  is_followup_enabled?: boolean;
  ig_username?: string;
  ig_id?: number;
  live_chat_url?: string;
  user_refs?: any[];
  custom_fields?: ManychatCustomField[];
  tags?: ManychatTag[];
}

export interface ManychatCustomField {
  id: number;
  name: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'array';
  value: any;
}

export interface ManychatTag {
  id: number;
  name: string;
}

export interface ManychatPageInfo {
  id: number;
  name: string;
}

export class ManychatClient {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any
  ): Promise<T> {
    let url = `${MANYCHAT_API_BASE}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      if (method === 'GET') {
        // For GET requests, add params as query string
        const params = new URLSearchParams();
        Object.keys(body).forEach(key => {
          params.append(key, String(body[key]));
        });
        url = `${url}?${params.toString()}`;
      } else {
        // For POST requests, add as body
        options.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Manychat API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Get page information
   */
  async getPageInfo(): Promise<{ data: ManychatPageInfo }> {
    return this.request('/fb/page/getInfo', 'GET');
  }

  /**
   * Get subscriber information by ID
   */
  async getSubscriberInfo(subscriberId: number): Promise<{ data: ManychatSubscriber }> {
    return this.request('/fb/subscriber/getInfo', 'GET', {
      subscriber_id: subscriberId,
    });
  }

  /**
   * Find subscriber by custom field value
   */
  async findSubscriberByField(
    fieldId: number,
    fieldValue: string
  ): Promise<{ data: ManychatSubscriber[] }> {
    return this.request('/fb/subscriber/findByCustomField', 'GET', {
      field_id: fieldId,
      field_value: fieldValue,
    });
  }

  /**
   * Find subscriber by name
   */
  async findSubscriberByName(name: string): Promise<{ data: ManychatSubscriber[] }> {
    return this.request('/fb/subscriber/findByName', 'GET', {
      name,
    });
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<{ data: ManychatTag[] }> {
    return this.request('/fb/page/getTags', 'GET');
  }

  /**
   * Get all custom fields
   */
  async getCustomFields(): Promise<{ data: ManychatCustomField[] }> {
    return this.request('/fb/page/getCustomFields', 'GET');
  }

  /**
   * Add tag to subscriber
   */
  async addTagToSubscriber(subscriberId: number, tagId: number): Promise<void> {
    await this.request('/fb/subscriber/addTag', 'POST', {
      subscriber_id: subscriberId,
      tag_id: tagId,
    });
  }

  /**
   * Remove tag from subscriber
   */
  async removeTagFromSubscriber(subscriberId: number, tagId: number): Promise<void> {
    await this.request('/fb/subscriber/removeTag', 'POST', {
      subscriber_id: subscriberId,
      tag_id: tagId,
    });
  }

  /**
   * Set custom field value for subscriber
   */
  async setCustomField(
    subscriberId: number,
    fieldId: number,
    fieldValue: any
  ): Promise<void> {
    await this.request('/fb/subscriber/setCustomField', 'POST', {
      subscriber_id: subscriberId,
      field_id: fieldId,
      field_value: fieldValue,
    });
  }

  /**
   * Create custom field
   */
  async createCustomField(
    name: string,
    type: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'array',
    description?: string
  ): Promise<{ data: ManychatCustomField }> {
    return this.request('/fb/page/createCustomField', 'POST', {
      name,
      type,
      description,
    });
  }
}

/**
 * Create a Manychat client instance
 */
export function createManychatClient(apiToken: string): ManychatClient {
  return new ManychatClient(apiToken);
}
