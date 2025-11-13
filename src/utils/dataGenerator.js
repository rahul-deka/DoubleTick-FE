const firstNames = [
  'Rahul', 'Aadhya', 'Vivaan', 'Ananya', 'Aditya', 'Diya', 'Vihaan', 'Ishita',
  'Arjun', 'Anushka', 'Sai', 'Saanvi', 'Ayaan', 'Navya', 'Krishna', 'Pari',
  'Ishaan', 'Kavya', 'Shaurya', 'Aanya', 'Atharva', 'Aarohi', 'Advait', 'Mira',
  'Reyansh', 'Kiara', 'Arnav', 'Ira', 'Kabir', 'Myra', 'Dhruv', 'Sara',
  'Shivansh', 'Riya', 'Pranav', 'Zara', 'Rudra', 'Avni', 'Ayush', 'Siya',
  'Lakshay', 'Prisha', 'Rohan', 'Aditi', 'Vedant', 'Shanaya', 'Aayansh', 'Pooja',
  'Yash', 'Neha', 'Aryan', 'Shreya', 'Kartik', 'Aisha', 'Dev', 'Nisha',
  'Aadi', 'Tanvi', 'Raghav', 'Divya', 'Harsh', 'Kritika', 'Karthik', 'Anjali',
  'Nikhil', 'Priya', 'Aarav', 'Simran', 'Varun', 'Sneha', 'Siddharth', 'Rhea',
  'Akshat', 'Pallavi', 'Aakash', 'Tanya', 'Ritvik', 'Meera', 'Abhinav', 'Vidya',
  'Kunal', 'Swati', 'Manav', 'Kavita', 'Ishan', 'Deepika', 'Shivam', 'Sakshi',
  'Pranay', 'Jyoti', 'Anmol', 'Madhuri', 'Parth', 'Sonal', 'Gaurav', 'Puja',
  'Mohit', 'Ritu', 'Viraj', 'Nidhi', 'Tanay', 'Megha', 'Aniket', 'Shruti'
];

const lastNames = [
  'Sharma', 'Kumar', 'Singh', 'Patel', 'Verma', 'Gupta', 'Reddy', 'Rao',
  'Mishra', 'Joshi', 'Agarwal', 'Mehta', 'Desai', 'Shah', 'Kapoor', 'Malhotra',
  'Iyer', 'Nair', 'Menon', 'Pillai', 'Krishnan', 'Srinivasan', 'Murthy', 'Bhatt',
  'Pandey', 'Trivedi', 'Sinha', 'Saxena', 'Varma', 'Shukla', 'Banerjee', 'Chatterjee',
  'Ghosh', 'Mukherjee', 'Roy', 'Das', 'Bose', 'Sen', 'Chaudhary', 'Kulkarni',
  'Jain', 'Chopra', 'Khanna', 'Sethi', 'Bhatia', 'Arora', 'Batra', 'Dutta',
  'Soni', 'Thakur', 'Chauhan', 'Yadav', 'Ahuja', 'Doshi', 'Naik', 'Dubey',
  'Kaur', 'Gill', 'Sandhu', 'Dhillon', 'Bajwa', 'Randhawa', 'Sidhu', 'Tiwari',
  'Khandelwal', 'Agrawal', 'Goyal', 'Mittal', 'Goel', 'Singhal', 'Saini', 'Rathore',
  'Bhargava', 'Chandra', 'Saxena', 'Mathur', 'Rastogi', 'Rawal', 'Tandon', 'Vohra',
  'Nanda', 'Bakshi', 'Kohli', 'Oberoi', 'Anand', 'Dixit', 'Srivastava', 'Pathak',
  'Rana', 'Bisht', 'Rawat', 'Thapa', 'Tamang', 'Choudhury', 'Prasad', 'Bhattacharya'
];

const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com', 'email.com'];

const addedByOptions = ['System', 'Admin', 'Sales Team', 'Marketing', 'Support'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone() {
  return `+1 (${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

function generateEmail(firstName, lastName) {
  const domain = domains[randomInt(0, domains.length - 1)];
  const random = randomInt(0, 100);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${random > 50 ? randomInt(1, 99) : ''}@${domain}`;
}

function generateDate() {
  const now = Date.now();
  const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60 * 1000);
  return new Date(randomInt(twoYearsAgo, now)).toISOString();
}

function generateAvatar(firstName, lastName) {
  return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random&size=40`;
}

export function generateCustomer(id) {
  const firstName = firstNames[randomInt(0, firstNames.length - 1)];
  const lastName = lastNames[randomInt(0, lastNames.length - 1)];
  
  return {
    id,
    name: `${firstName} ${lastName}`,
    phone: generatePhone(),
    email: generateEmail(firstName, lastName),
    age: randomInt(20, 60),
    score: randomInt(0, 100),
    lastMessageAt: generateDate(),
    addedBy: addedByOptions[randomInt(0, addedByOptions.length - 1)],
    avatar: generateAvatar(firstName, lastName),
    firstName,
    lastName
  };
}

export function generateCustomers(startId, count) {
  const customers = [];
  for (let i = 0; i < count; i++) {
    customers.push(generateCustomer(startId + i));
  }
  return customers;
}

export function* generateCustomersInBatches(totalCount, batchSize = 10000) {
  for (let i = 0; i < totalCount; i += batchSize) {
    const count = Math.min(batchSize, totalCount - i);
    yield generateCustomers(i + 1, count);
  }
}