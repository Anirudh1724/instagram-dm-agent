// Mock data for demo mode
export const DEMO_CLIENT = {
    client_id: 'demo-client',
    business_name: 'Leafcraft Studios'
};

// Mock Analytics Data
export const getMockAnalytics = (period: 'daily' | 'weekly' | 'monthly') => {
    const multiplier = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    return {
        leads_contacted: 47 * multiplier,
        unique_leads: 32 * multiplier,
        messages_sent: 156 * multiplier,
        response_rate: 78,
        leads_change: '+12%',
        unique_change: '+8%',
        messages_change: '+23%',
        response_change: '+5%',
        chart_data: [
            { label: 'Mon', received: 12, sent: 28 },
            { label: 'Tue', received: 19, sent: 35 },
            { label: 'Wed', received: 15, sent: 42 },
            { label: 'Thu', received: 23, sent: 38 },
            { label: 'Fri', received: 28, sent: 45 },
            { label: 'Sat', received: 18, sent: 32 },
            { label: 'Sun', received: 14, sent: 25 },
        ]
    };
};

// Mock Leads
const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 3600000).toISOString();

export const MOCK_LEADS = [
    {
        customer_id: 'lead-001',
        username: 'sarah_designs',
        name: 'Sarah Mitchell',
        status: 'Qualified',
        lead_type: 'qualified',
        last_message: "That sounds amazing! I'd love to learn more about your interior design services.",
        last_interaction: hoursAgo(2),
        message_count: 12,
        source: 'DM'
    },
    {
        customer_id: 'lead-002',
        username: 'mike_realestate',
        name: 'Mike Thompson',
        status: 'Meeting Booked',
        lead_type: 'qualified',
        last_message: "Perfect, I've booked the call for Thursday at 3 PM. Looking forward to it!",
        last_interaction: hoursAgo(5),
        message_count: 18,
        source: 'DM'
    },
    {
        customer_id: 'lead-003',
        username: 'priya_homes',
        name: 'Priya Sharma',
        status: 'Engaged',
        lead_type: 'qualified',
        last_message: 'Can you share some portfolio examples for residential projects?',
        last_interaction: hoursAgo(8),
        message_count: 8,
        source: 'DM'
    },
    {
        customer_id: 'lead-004',
        username: 'john_builder',
        name: 'John Carter',
        status: 'New',
        lead_type: 'freebie',
        last_message: 'Hi! I saw your latest project post and had to reach out.',
        last_interaction: hoursAgo(1),
        message_count: 3,
        source: 'DM'
    },
    {
        customer_id: 'lead-005',
        username: 'emma_interiors',
        name: 'Emma Rodriguez',
        status: 'Qualified',
        lead_type: 'qualified',
        last_message: "We're renovating our office space and need a designer ASAP!",
        last_interaction: daysAgo(1),
        message_count: 15,
        source: 'DM'
    },
    {
        customer_id: 'lead-006',
        username: 'alex_property',
        name: 'Alex Chen',
        status: 'Engaged',
        lead_type: 'unqualified',
        last_message: "What's your typical budget range for projects?",
        last_interaction: daysAgo(1),
        message_count: 6,
        source: 'DM'
    },
    {
        customer_id: 'lead-007',
        username: 'rachel_studio',
        name: 'Rachel Kim',
        status: 'New',
        lead_type: 'qualified',
        last_message: 'Love your aesthetic! Do you take on boutique retail projects?',
        last_interaction: hoursAgo(3),
        message_count: 4,
        source: 'DM'
    },
    {
        customer_id: 'lead-008',
        username: 'david_homes',
        name: 'David Martinez',
        status: 'Meeting Booked',
        lead_type: 'qualified',
        last_message: 'Great! See you next Tuesday for the consultation.',
        last_interaction: daysAgo(2),
        message_count: 22,
        source: 'DM'
    }
];

// Mock Followup Leads
export const MOCK_FOLLOWUP_LEADS = [
    {
        customer_id: 'lead-005',
        username: 'emma_interiors',
        name: 'Emma Rodriguez',
        followup_count: 2,
        last_followup_at: hoursAgo(12),
        last_interaction: daysAgo(1),
        message_count: 15,
        last_message: "We're renovating our office space and need a designer ASAP!",
        status: 'Qualified'
    },
    {
        customer_id: 'lead-006',
        username: 'alex_property',
        name: 'Alex Chen',
        followup_count: 1,
        last_followup_at: daysAgo(1),
        last_interaction: daysAgo(1),
        message_count: 6,
        last_message: "What's your typical budget range for projects?",
        status: 'Engaged'
    },
    {
        customer_id: 'lead-009',
        username: 'lisa_ventures',
        name: 'Lisa Wong',
        followup_count: 3,
        last_followup_at: hoursAgo(6),
        last_interaction: daysAgo(3),
        message_count: 9,
        last_message: 'Interested in your commercial design packages.',
        status: 'New'
    }
];

// Mock Booking Leads
export const MOCK_BOOKING_LEADS = [
    {
        customer_id: 'lead-002',
        username: 'mike_realestate',
        name: 'Mike Thompson',
        stage: 'meeting_booked',
        last_interaction: hoursAgo(5),
        message_count: 18,
        last_message: "Perfect, I've booked the call for Thursday at 3 PM!",
        status: 'Meeting Booked'
    },
    {
        customer_id: 'lead-008',
        username: 'david_homes',
        name: 'David Martinez',
        stage: 'meeting_booked',
        last_interaction: daysAgo(2),
        message_count: 22,
        last_message: 'Great! See you next Tuesday for the consultation.',
        status: 'Meeting Booked'
    },
    {
        customer_id: 'lead-010',
        username: 'nina_spaces',
        name: 'Nina Patel',
        stage: 'booking_intent',
        last_interaction: hoursAgo(4),
        message_count: 11,
        last_message: 'What times work for a discovery call this week?',
        status: 'Booking Intent'
    },
    {
        customer_id: 'lead-011',
        username: 'ryan_projects',
        name: 'Ryan Okonkwo',
        stage: 'booking_intent',
        last_interaction: hoursAgo(8),
        message_count: 14,
        last_message: "I'd like to schedule a consultation for my restaurant redesign.",
        status: 'Booking Intent'
    }
];

// Mock Conversations
export const MOCK_CONVERSATIONS: Record<string, {
    customer_id: string;
    username: string;
    name: string;
    messages: Array<{ role: string; content: string; timestamp: string; is_followup?: boolean }>;
    message_count: number;
    last_interaction: string;
    followup_count: number;
    stage: string;
    agent_blocked?: boolean;
}> = {
    'lead-001': {
        customer_id: 'lead-001',
        username: 'sarah_designs',
        name: 'Sarah Mitchell',
        message_count: 12,
        last_interaction: hoursAgo(2),
        followup_count: 0,
        stage: 'qualified',
        messages: [
            { role: 'customer', content: 'Hey! I love your work on the Riverside project 😍', timestamp: hoursAgo(48) },
            { role: 'agent', content: "Thank you so much, Sarah! The Riverside project was such a joy to work on. Are you looking to transform your space as well?", timestamp: hoursAgo(47) },
            { role: 'customer', content: "Yes! I just bought a new apartment and want to give it a modern minimalist vibe", timestamp: hoursAgo(46) },
            { role: 'agent', content: "That's exciting! Congratulations on the new place 🎉 Modern minimalism is one of our specialties. How many rooms are you looking to redesign?", timestamp: hoursAgo(45) },
            { role: 'customer', content: "Living room, bedroom, and a small home office. Maybe 1500 sq ft total?", timestamp: hoursAgo(24) },
            { role: 'agent', content: "Perfect! That's a great size for a cohesive design flow. For a space like that, we typically work with budgets starting around $25-40K depending on furniture selections. Does that align with what you had in mind?", timestamp: hoursAgo(23) },
            { role: 'customer', content: "That sounds amazing! I'd love to learn more about your interior design services.", timestamp: hoursAgo(2) },
            { role: 'agent', content: "I'd love to walk you through our process! We start with a discovery call to understand your vision, followed by mood boards and 3D renders before any work begins. Would you like to schedule a free 30-minute consultation?", timestamp: hoursAgo(1) },
        ]
    },
    'lead-002': {
        customer_id: 'lead-002',
        username: 'mike_realestate',
        name: 'Mike Thompson',
        message_count: 18,
        last_interaction: hoursAgo(5),
        followup_count: 0,
        stage: 'meeting_booked',
        messages: [
            { role: 'customer', content: "Hi there! I'm a real estate developer and saw your commercial portfolio.", timestamp: daysAgo(3) },
            { role: 'agent', content: "Hello Mike! Thanks for reaching out. Yes, we do quite a bit of commercial work – offices, retail spaces, and hospitality projects. What kind of development are you working on?", timestamp: daysAgo(3) },
            { role: 'customer', content: "We have a 10-unit apartment complex going up. Looking for someone to design the model unit and common areas.", timestamp: daysAgo(3) },
            { role: 'agent', content: "That sounds like a fantastic project! Model units are so important for marketing. We've done several for developers in the area. When is your target completion date?", timestamp: daysAgo(2) },
            { role: 'customer', content: "Construction finishes in 8 weeks. Tight timeline!", timestamp: daysAgo(2) },
            { role: 'agent', content: "8 weeks is tight but definitely doable for a model unit! We have vendor relationships that can expedite furniture and fixtures. Would you be open to a quick call this week to discuss the scope?", timestamp: daysAgo(2) },
            { role: 'customer', content: "Yes absolutely. Thursday afternoon works best for me.", timestamp: daysAgo(1) },
            { role: 'agent', content: "Thursday works great! I have availability at 2 PM or 3 PM. Which would you prefer? I'll send over a calendar invite right away.", timestamp: daysAgo(1) },
            { role: 'customer', content: "Perfect, I've booked the call for Thursday at 3 PM. Looking forward to it!", timestamp: hoursAgo(5) },
            { role: 'agent', content: "Excellent! I've got you down for Thursday at 3 PM. I'll send the Zoom link shortly. Looking forward to hearing more about your vision for the complex! 🏢", timestamp: hoursAgo(5) },
        ]
    },
    'lead-003': {
        customer_id: 'lead-003',
        username: 'priya_homes',
        name: 'Priya Sharma',
        message_count: 8,
        last_interaction: hoursAgo(8),
        followup_count: 0,
        stage: 'engaged',
        messages: [
            { role: 'customer', content: 'Hello! Your Instagram is stunning. Do you work with traditional Indian design elements?', timestamp: hoursAgo(24) },
            { role: 'agent', content: "Hi Priya! Thank you for the kind words! Yes, we love incorporating traditional elements with contemporary design. We've done several projects blending Indian aesthetics with modern minimalism. Are you thinking of a specific space?", timestamp: hoursAgo(23) },
            { role: 'customer', content: "We just bought a villa in Gurgaon and want it to feel both modern and rooted in our culture.", timestamp: hoursAgo(12) },
            { role: 'agent', content: "What a beautiful vision! Villas are such a joy to design. We could incorporate traditional jali work, handcrafted brass elements, or contemporary takes on Indian textiles. How large is the villa?", timestamp: hoursAgo(11) },
            { role: 'customer', content: 'Can you share some portfolio examples for residential projects?', timestamp: hoursAgo(8) },
            { role: 'agent', content: "Of course! I'll DM you a link to our residential portfolio with a few projects that blend traditional and modern elements. You'll especially love the Kapoor residence we completed last year – very similar vision to yours! ✨", timestamp: hoursAgo(7) },
        ]
    },
    'lead-004': {
        customer_id: 'lead-004',
        username: 'john_builder',
        name: 'John Carter',
        message_count: 3,
        last_interaction: hoursAgo(1),
        followup_count: 0,
        stage: 'new',
        messages: [
            { role: 'customer', content: 'Hi! I saw your latest project post and had to reach out.', timestamp: hoursAgo(1) },
            { role: 'agent', content: "Hi John! Thanks for reaching out! Which project caught your eye? We'd love to know more about what you're looking for.", timestamp: hoursAgo(1) },
            { role: 'customer', content: "The penthouse with the floating staircase. Incredible work!", timestamp: hoursAgo(1) },
        ]
    },
    'lead-005': {
        customer_id: 'lead-005',
        username: 'emma_interiors',
        name: 'Emma Rodriguez',
        message_count: 15,
        last_interaction: daysAgo(1),
        followup_count: 2,
        stage: 'qualified',
        messages: [
            { role: 'customer', content: "We're renovating our office space and need a designer ASAP!", timestamp: daysAgo(5) },
            { role: 'agent', content: "Hi Emma! We'd love to help with your office renovation. What's driving the timeline – are you expanding or refreshing the current space?", timestamp: daysAgo(5) },
            { role: 'customer', content: "Expanding! We just leased the floor above us. Need to design it fast.", timestamp: daysAgo(4) },
            { role: 'agent', content: "Congratulations on the expansion! That's exciting. We specialize in fast-turnaround commercial projects. What's your deadline and roughly how many square feet?", timestamp: daysAgo(4) },
            { role: 'customer', content: "6 weeks and about 4000 sq ft. It's going to be an open floor plan with some meeting rooms.", timestamp: daysAgo(3) },
            { role: 'agent', content: "6 weeks is definitely achievable! We've delivered similar projects in that timeframe. For 4000 sq ft open plan with meeting rooms, we're typically looking at $60-80K including furniture. Would that work for your budget?", timestamp: daysAgo(3) },
            { role: 'agent', content: "Hi Emma! Just following up on our conversation about your office expansion. Have you had a chance to think about the budget range? Happy to discuss options if that helps! 😊", timestamp: daysAgo(2), is_followup: true },
            { role: 'agent', content: "Hey Emma! Wanted to check in one more time about the office project. I know you mentioned it was urgent – still happy to jump on a quick call if that helps move things forward! 📞", timestamp: daysAgo(1), is_followup: true },
        ]
    },
    'lead-006': {
        customer_id: 'lead-006',
        username: 'alex_property',
        name: 'Alex Chen',
        message_count: 6,
        last_interaction: daysAgo(1),
        followup_count: 1,
        stage: 'engaged',
        messages: [
            { role: 'customer', content: "Hello, I'm interested in your design services.", timestamp: daysAgo(4) },
            { role: 'agent', content: "Hi Alex! Thanks for reaching out. We'd love to learn more about your project. Is this for residential or commercial space?", timestamp: daysAgo(4) },
            { role: 'customer', content: "Residential. A 2BHK apartment.", timestamp: daysAgo(3) },
            { role: 'agent', content: "Great! 2BHK apartments are one of our most popular project types. What style are you leaning towards – modern, contemporary, traditional, or something else?", timestamp: daysAgo(3) },
            { role: 'customer', content: "What's your typical budget range for projects?", timestamp: daysAgo(2) },
            { role: 'agent', content: "For a 2BHK apartment, our projects typically range from ₹8-15 lakhs depending on the scope and furniture selections. We can work within various budgets though! What range were you thinking?", timestamp: daysAgo(2) },
            { role: 'agent', content: "Hi Alex! Following up on our chat about your 2BHK. Happy to discuss budget-friendly options if that helps. Let me know! 🏠", timestamp: daysAgo(1), is_followup: true },
        ]
    }
};

// Mock Activities
export const getMockActivities = () => [
    { type: 'meeting' as const, text: 'Mike booked a meeting', time: '5 hours ago' },
    { type: 'message' as const, text: 'John became a new lead', time: '1 hour ago' },
    { type: 'converted' as const, text: 'Sarah converted to customer', time: '2 hours ago' },
    { type: 'followup' as const, text: 'Emma received followup message', time: '12 hours ago' },
    { type: 'new-lead' as const, text: 'Rachel sent a new message', time: '3 hours ago' },
    { type: 'meeting' as const, text: 'Olivia booked a meeting', time: '18 minutes ago' },
];

// Aliases for compatibility
export const DEMO_LEADS = MOCK_LEADS.map(lead => ({
    ...lead,
    id: lead.customer_id,
    profile_pic: undefined,
    followup_count: 0,
    last_followup: undefined,
}));

export const DEMO_MESSAGES: Record<string, Array<{
    id: string;
    role: 'customer' | 'agent';
    content: string;
    timestamp: string;
    is_followup?: boolean;
}>> = {};

// Build DEMO_MESSAGES from MOCK_CONVERSATIONS
Object.entries(MOCK_CONVERSATIONS).forEach(([key, conv]) => {
    DEMO_MESSAGES[key] = conv.messages.map((msg, idx) => ({
        id: `${key}-${idx}`,
        role: msg.role as 'customer' | 'agent',
        content: msg.content,
        timestamp: msg.timestamp,
        is_followup: msg.is_followup,
    }));
});

// Analytics data structure for Dashboard
export const DEMO_ANALYTICS = {
    stats: {
        daily: {
            leadsContacted: 47,
            uniqueLeads: 32,
            messagesSent: 156,
            responseRate: 78,
            bookings: 12,
        },
        weekly: {
            leadsContacted: 329,
            uniqueLeads: 224,
            messagesSent: 1092,
            responseRate: 72,
            bookings: 84,
        },
        monthly: {
            leadsContacted: 1410,
            uniqueLeads: 960,
            messagesSent: 4680,
            responseRate: 68,
            bookings: 360,
        },
    },
    chartData: {
        daily: [
            { label: '6AM', received: 2, sent: 5 },
            { label: '9AM', received: 8, sent: 12 },
            { label: '12PM', received: 15, sent: 22 },
            { label: '3PM', received: 12, sent: 18 },
            { label: '6PM', received: 8, sent: 14 },
            { label: '9PM', received: 4, sent: 8 },
        ],
        weekly: [
            { label: 'Mon', received: 12, sent: 6 },
            { label: 'Tue', received: 45, sent: 8 },
            { label: 'Wed', received: 62, sent: 12 },
            { label: 'Thu', received: 38, sent: 8 },
            { label: 'Fri', received: 25, sent: 4 },
            { label: 'Sat', received: 18, sent: 2 },
            { label: 'Sun', received: 32, sent: 4 },
        ],
        monthly: [
            { label: 'Week 1', received: 280, sent: 45 },
            { label: 'Week 2', received: 350, sent: 62 },
            { label: 'Week 3', received: 420, sent: 78 },
            { label: 'Week 4', received: 360, sent: 55 },
        ],
    },
    recentActivity: getMockActivities(),
};
