// Simple adapter to sync LowDB with a GitHub Gist
export class GistAdapter {
  constructor(gistId, filename, token) {
    this.gistId = gistId;
    this.filename = filename;
    this.token = token;
    this.baseUrl = 'https://api.github.com/gists';
  }

  // Read data from the gist
  read() {
    return fetch(`${this.baseUrl}/${this.gistId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github+json'
      }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data) return null;

      const file = data.files[this.filename];
      if (!file) {
        return null;
      }
      return JSON.parse(file.content);
    })
    .catch(error => {
      console.error('Error reading from gist:', error);
      return null;
    });
  }

  // Write data to the gist
  write(data) {
    return fetch(`${this.baseUrl}/${this.gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [this.filename]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error writing to gist:', error);
      throw error;
    });
  }
}
