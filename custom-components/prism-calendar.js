
class PrismCalendarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getStubConfig() {
    return { 
      entity: "calendar.example", 
      max_events: 3,
      icon_color: "#f87171",
      dot_color: "#f87171"
    }
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: { entity: { domain: "calendar" } }
        },
        {
          name: "max_events",
          selector: { number: { min: 1, max: 10, step: 1, mode: "box" } }
        },
        {
          name: "icon_color",
          selector: { color_rgb: {} }
        },
        {
          name: "dot_color",
          selector: { color_rgb: {} }
        }
      ]
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    this.config = config;
    // Set defaults
    if (!this.config.max_events) {
      this.config.max_events = 3;
    }
    // Normalize colors (convert RGB arrays to hex if needed)
    if (this.config.icon_color) {
      this.config.icon_color = this._normalizeColor(this.config.icon_color);
    } else {
      this.config.icon_color = "#f87171";
    }
    if (this.config.dot_color) {
      this.config.dot_color = this._normalizeColor(this.config.dot_color);
    } else {
      this.config.dot_color = "#f87171";
    }
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this.config && this.config.entity) {
      const entity = hass.states[this.config.entity];
      this._entity = entity || null;
      this.render();
    }
  }

  getCardSize() {
    return 3;
  }

  connectedCallback() {
    if (this.config) {
      this.render();
    }
  }

  render() {
    if (!this.config || !this.config.entity) return;
    
    const attr = this._entity ? this._entity.attributes : {};
    const nextEventTitle = attr.message || 'No upcoming events';
    const nextEventStart = attr.start_time;
    
    // We can't fetch full list easily without API calls in pure JS card without complexity. 
    // We will display the NEXT event prominently.
    
    let timeStr = '';
    if (nextEventStart) {
        const date = new Date(nextEventStart);
        timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const maxEvents = this.config.max_events || 3;
    const iconColor = this._normalizeColor(this.config.icon_color || "#f87171");
    const dotColor = this._normalizeColor(this.config.dot_color || "#f87171");
    
    // Generate event items (for now we only have one real event, rest are placeholders)
    let eventItems = '';
    for (let i = 0; i < maxEvents; i++) {
      const isActive = i === 0 && nextEventTitle !== 'No upcoming events';
      const eventTitle = i === 0 ? nextEventTitle : 'Keine weiteren Termine';
      const eventTime = i === 0 ? (timeStr || 'Ganztägig') : '-';
      const opacity = i === 0 ? '1' : '0.6';
      
      eventItems += `
        <div class="event-item" style="opacity: ${opacity};">
          <div class="timeline">
            <div class="dot ${isActive ? 'active' : ''}" style="${isActive ? `background: ${dotColor}; box-shadow: 0 0 8px ${dotColor}99;` : ''}"></div>
          </div>
          <div class="event-info">
            <div class="event-title">${eventTitle}</div>
            <div class="event-time">
              <ha-icon icon="mdi:clock-outline" style="--mdc-icon-size: 12px;"></ha-icon>
              ${eventTime}
            </div>
          </div>
        </div>
      `;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .card {
          background: rgba(30, 32, 36, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-bottom: 1px solid rgba(0, 0, 0, 0.4);
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0,0,0,0.3);
          padding: 20px;
          color: white;
        }
        
        .header {
            display: flex; gap: 20px; align-items: center; margin-bottom: 24px; padding-left: 8px;
        }
        .icon-box {
            width: 42px; height: 42px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            flex-shrink: 0;
        }
        .title { font-size: 18px; font-weight: 500; color: #e0e0e0; }
        .subtitle { font-size: 12px; font-weight: 500; color: #999; text-transform: uppercase; margin-top: 2px; }
        
        .event-list {
            display: flex; flex-direction: column; gap: 12px;
        }
        .event-item {
            display: flex; gap: 16px; align-items: center;
            background: rgba(20, 20, 20, 0.4);
            box-shadow: inset 2px 2px 5px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 12px 16px;
            border: 1px solid rgba(255,255,255,0.02);
        }
        .timeline {
            display: flex; flex-direction: column; align-items: center; justify-content: center; width: 42px; flex-shrink: 0;
            margin-left: 1px; /* Precise alignment adjustment */
        }
        /* Visual alignment helper: The header icon is 42px wide. We want these dots centered relative to that column */
        
        .dot {
            width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.2);
        }
        .dot.active {
            /* Color set inline */
        }
        
        .event-info {
            flex: 1;
        }
        .event-title { font-size: 15px; font-weight: 500; color: white; margin-bottom: 4px; }
        .event-time { font-size: 12px; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 6px; }
        
      </style>
      <div class="card">
        <div class="header">
            <div class="icon-box" style="background: ${this._hexToRgba(iconColor, 0.15)}; color: ${iconColor};">
                <ha-icon icon="mdi:calendar"></ha-icon>
            </div>
            <div>
                <div class="title">Kalender</div>
                <div class="subtitle">Nächstes Event</div>
            </div>
        </div>
        
        <div class="event-list">
            ${eventItems}
        </div>
      </div>
    `;
  }

  _normalizeColor(color) {
    // If color is an array [r, g, b] from color_rgb selector, convert to hex
    if (Array.isArray(color) && color.length >= 3) {
      const r = color[0].toString(16).padStart(2, '0');
      const g = color[1].toString(16).padStart(2, '0');
      const b = color[2].toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    // If it's already a hex string, return as is
    return color;
  }

  _hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

customElements.define('prism-calendar', PrismCalendarCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "prism-calendar",
  name: "Prism Calendar",
  preview: true,
  description: "A custom calendar card with configurable events and colors"
});
