const inquirer = require("inquirer");
const mysql = require("mysql");
const util = require("util");

const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  database: "employee_tracker",
  password: "rootroot",
});
const query = util.promisify(db.query).bind(db);

const showMenu = async () => {
  const answers = await inquirer.prompt([
    {
      name: "choice",
      type: "list",
      message: "What would you like to do?",
      choices: [
        "Add Department",
        "Add Role",
        "Add Employee",
        "View All Departments",
        "View All Roles",
        "View All Employees",
        "Update Employee Role",
      ],
    },
  ]);

  switch (answers.choice) {
    case "Add Department":
      addDepartment();
      break;
    case "Add Role":
      addRole();
      break;
    case "Add Employee":
      addEmployee();
      break;
    case "View All Departments":
      viewDepartments();
      break;
    case "View All Roles":
      viewRoles();
      break;
    case "View All Employees":
      viewAllEmployees();
      break;
    case "Update Employee Role":
      updateEmployeeRole();
      break;
  }
};

const addDepartment = async () => {
  const answer = await inquirer.prompt([
    {
      name: "department",
      type: "input",
      message: "Enter new department name:",
    },
  ]);
  try {
    await query(
      `INSERT INTO department (dept_name) VALUES ('${answer.department}')`
    );
    console.log("\nSuccessfully added new department.\n");
  } catch (error) {
    console.error("Failed to add Dept.");
  }
  showMenu();
};

const addRole = async () => {
  const answers = await inquirer.prompt([
    {
      name: "role",
      type: "input",
      message: "Role Name?",
    },
    {
      name: "pay",
      type: "input",
      message: (answers) => `Salary for ${answers.role}?`,
    },
    {
      name: "department",
      type: "list",
      message: "What department does this role belong to?",
      choices: async () => {
        let result = await query(`SELECT * from department`);
        return result.map((row) => row.dept_name);
      },
    },
  ]);

  try {
    await query(
      `INSERT INTO role (title, salary, department_id)` +
        `VALUES ('${answers.role}', '${answers.pay}', (SELECT id FROM department WHERE dept_name = '${answers.department}')) `
    );
    console.log(`\nSuccessfully added Role`);
  } catch (error) {
    console.error(error);
  }
  showMenu();
};

const viewRoles = async () => {
  try {
    const roles = await query(`SELECT * from role`);
    console.table(roles);
  } catch (error) {
    console.error(error);
  }
  showMenu();
};
const viewDepartments = async () => {
  try {
    const result = await query(`SELECT * from department`);
    result.forEach((row) => console.log(row.dept_name));
  } catch (error) {
    console.error("Failed to load departments");
  }
  showMenu();
};
const addEmployee = async () => {
  const answers = await inquirer.prompt([
    {
      name: "firstName",
      type: "input",
      message: `First Name?`,
    },
    {
      name: "lastName",
      type: "input",
      message: `Last Name?:`,
    },
    {
      name: "department",
      type: "list",
      message: "What department hired this employee?",
      choices: async () => {
        try {
          let departments = await query(`SELECT * FROM department`);
          return departments.map((element) => element.dept_name);
        } catch (error) {
          console.error(error);
          showMenu();
        }
      },
    },
    {
      name: "role",
      type: "list",
      message: `What is the employee's title?`,
      choices: async (answers) => {
        try {
          let roles = await query("SELECT * FROM role");
          console.log(roles);
          return roles.map((role) => role.title);
        } catch (error) {
          console.error(error);
          showMenu();
        }
      },
    },
    {
      name: "hasManager",
      type: "list",
      message: (answers) =>
        `Does ${answers.firstName} ${answers.lastName} have a manager ? `,
      choices: ["Yes", "No"],
    },
    {
      name: "manager",
      type: "list",
      message: (answers) =>
        `Who is ${answers.firstName} ${answers.lastName} manager ? `,
      choices: async (answers) => {
        let result = await query(
          `SELECT first_name, last_name FROM employee INNER JOIN role ON employee.role_id = role.id` +
            ` INNER JOIN department on role.department_id = department.id WHERE department.dept_name = '${answers.department}'; `
        );
        return result.map(
          (person) => `${person.first_name} ${person.last_name} `
        );
      },
      when: (answers) => answers.hasManager === "Yes",
    },
  ]);
  if (answers.hasManager === "Yes") {
    let manager = answers.manager.split(" ");
    try {
      const role = await query(
        `SELECT id FROM role WHERE title = '${answers.role}'`
      );
      const plainRole = Object.assign({}, role[0]).id;
      const managerId = await query(
        `SELECT id FROM employee WHERE first_name = '${manager[0]}' AND last_name = '${manager[1]}'`
      );
      const plainManagerId = Object.assign({}, managerId[0]).id;

      await query(
        ` INSERT INTO employee(first_name, last_name, role_id, manager_id) VALUES('${answers.firstName}', '${answers.lastName}', '${plainRole}','${plainManagerId}')`
      );
      console.log(
        `\nSuccessfully added new employee ${answers.firstName} ${answers.lastName} to ${answers.department} as a ${answers.role}.\n`
      );
    } catch (error) {
      console.error(error);
    }
    showMenu();
  } else {
    try {
      await query(
        `INSERT INTO employee(first_name, last_name, role_id) VALUES("${answers.firstName}", "${answers.lastName}", (SELECT id FROM role WHERE title = '${answers.roleSelect}'))`
      );
      console.log(
        `\nSuccessfully added new employee ${answers.firstName} ${answers.lastName} to ${answers.department} as a ${answers.role}.\n`
      );
    } catch (error) {
      console.error(error);
    }
    showMenu();
  }
};

const viewAllEmployees = async () => {
  try {
    let employees = await query("SELECT * FROM employee");
    console.table(employees);
  } catch (error) {
    console.error(error);
  }
  showMenu();
};

const updateEmployeeRole = async () => {
  const answers = await inquirer.prompt([
    {
      name: "employeeSelect",
      type: "list",
      message: "Update which employee?:",
      choices: async () => {
        try {
          const names = await query(
            `SELECT first_name, last_name FROM employee; `
          );
          console.table(names);
          return names.map(
            (employee) => `${employee.first_name} ${employee.last_name} `
          );
        } catch (error) {
          console.error(error);
          showMenu();
        }
      },
    },
    {
      name: "department",
      type: "list",
      message: "What department is the new role in?",
      choices: async () => {
        try {
          const departments = await query("SELECT dept_name FROM department");
          return departments.map((department) => department.dept_name);
        } catch (error) {
          console.error(error);
          showMenu();
        }
      },
    },
    {
      name: "roleSelect",
      type: "list",
      message: `What is the employee's new role?`,
      choices: async (answers) => {
        try {
          const roles = await query(
            `SELECT title FROM role WHERE department_id=(SELECT id FROM department WHERE dept_name = '${answers.department}')`
          );
          return roles.map((role) => role.title);
        } catch (error) {
          console.error(error);
          showMenu();
        }
      },
    },
  ]);

  const name = answers.employeeSelect.split(" ");
  const first = name[0];
  const last = name[1];
  try {
    await query(
      `UPDATE employee SET role_id = (SELECT id FROM role WHERE title='${answers.roleSelect}') WHERE first_name='${first}' AND last_name='${last}'`
    );
    console.log(
      `\nSuccessfully updated ${answers.employeeSelect}'s role to ${answers.roleSelect}.\n`
    );
  } catch (error) {
    console.error(error);
  }
  showMenu();
};

const init = () => {
  try {
    db.connect();
  } catch (error) {
    console.log(error);
  }
  showMenu();
};

init();
