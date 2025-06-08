import { gapi } from 'gapi-script';

class CalendarService {
  private token: string | null = null;
  private initialized: boolean = false;

  async initClient() {
    if (this.initialized) return;

    await new Promise((resolve) => {
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: 'AIzaSyCC-zUZCKwUHoIVh62R5ij-9H2xmFnhgJE',
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });
        this.initialized = true;
        resolve(true);
      });
    });
  }

  setToken(token: string) {
    this.token = token;
    if (gapi.client) {
      gapi.client.setToken({ access_token: token });
    }
  }

  async listEvents(timeMin: Date, timeMax: Date) {
    if (!this.token) throw new Error('Not authenticated');

    try {
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.result.items;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async createEvent(event: any) {
    if (!this.token) throw new Error('Not authenticated');

    try {
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      return response.result;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: any) {
    if (!this.token) throw new Error('Not authenticated');

    try {
      const response = await gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
      });
      return response.result;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    if (!this.token) throw new Error('Not authenticated');

    try {
      await gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
}

export const calendarService = new CalendarService();