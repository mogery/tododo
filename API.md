# tododo API Documentation

Base URL: `http://localhost:3000/api`

## Endpoints

### Get Today's Tasks

Returns all tasks due today, including one-time todos and recurring tasks scheduled for today.

```
GET /api/tasks/today
```

#### Response

```json
{
  "date": "2024-01-15",
  "todos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Buy groceries",
      "description": "Milk, eggs, bread",
      "isCompleted": false,
      "completedAt": null,
      "dueDate": "2024-01-15",
      "createdAt": "2024-01-14T10:00:00.000Z",
      "updatedAt": "2024-01-14T10:00:00.000Z",
      "tags": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440000",
          "name": "Shopping",
          "color": "#10b981"
        }
      ]
    }
  ],
  "recurringTasks": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Morning standup",
      "description": "Daily team sync",
      "recurrenceType": "weekly",
      "daysOfWeek": [1, 2, 3, 4, 5],
      "datesOfMonth": null,
      "isActive": true,
      "startDate": null,
      "endDate": null,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z",
      "isCompletedToday": false
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Today's date in YYYY-MM-DD format |
| `todos` | array | One-time tasks due today or overdue |
| `recurringTasks` | array | Recurring tasks scheduled for today |
| `todos[].tags` | array | Tags associated with the task |
| `recurringTasks[].isCompletedToday` | boolean | Whether the recurring task has been completed today |

---

### Create Task

Creates a new one-time task.

```
POST /api/tasks
```

#### Request Body

```json
{
  "name": "Buy groceries",
  "description": "Milk, eggs, bread",
  "dueDate": "2024-01-15",
  "tagIds": ["660e8400-e29b-41d4-a716-446655440000"]
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Task name (non-empty) |
| `description` | string | No | Task description |
| `dueDate` | string | No | Due date in YYYY-MM-DD format |
| `tagIds` | array | No | Array of tag UUIDs to associate |

#### Response

**201 Created**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Buy groceries",
  "description": "Milk, eggs, bread",
  "isCompleted": false,
  "completedAt": null,
  "dueDate": "2024-01-15",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z",
  "tags": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Shopping",
      "color": "#10b981"
    }
  ]
}
```

**400 Bad Request**

```json
{
  "error": "name is required and must be a non-empty string"
}
```

**500 Internal Server Error**

```json
{
  "error": "Failed to create task"
}
```

---

## Examples

### cURL

**Get today's tasks:**

```bash
curl http://localhost:3000/api/tasks/today
```

**Create a task:**

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name": "Buy groceries", "dueDate": "2024-01-15"}'
```

### JavaScript (fetch)

```javascript
// Get today's tasks
const response = await fetch('/api/tasks/today');
const data = await response.json();

// Create a task
const newTask = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Buy groceries',
    dueDate: '2024-01-15'
  })
}).then(r => r.json());
```
