import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedHR() {
    const depts = [
        { name: "Production", description: "Juice production and processing" },
        { name: "Procurement", description: "Sourcing and purchasing" },
        { name: "Events", description: "Event catering and delivery" },
        { name: "Accounting", description: "Finance and bookkeeping" },
        { name: "Sales", description: "Sales and customer relations" },
    ];
    const departments: { id: string; name: string }[] = [];
    for (const d of depts) {
        let dept = await prisma.department.findFirst({ where: { name: d.name } });
        if (!dept) {
            dept = await prisma.department.create({
                data: { name: d.name, description: d.description ?? undefined },
            });
        }
        departments.push(dept);
    }

    const rolesList = [
        "Juice Mixer",
        "Procurement Officer",
        "Event Staff",
        "Accountant",
        "Admin",
    ];
    const roles: { id: string; name: string }[] = [];
    for (const name of rolesList) {
        let role = await prisma.role.findFirst({ where: { name } });
        if (!role) {
            role = await prisma.role.create({
                data: { name, permissions: "[]" },
            });
        }
        roles.push(role);
    }

    const prodDept = departments.find(d => d.name === "Production") ?? departments[0];
    const eventsDept = departments.find(d => d.name === "Events") ?? departments[0];
    const mixerRole = roles.find(r => r.name === "Juice Mixer") ?? roles[0];
    const eventStaffRole = roles.find(r => r.name === "Event Staff") ?? roles[0];

    const existingSarah = await prisma.employee.findFirst({
        where: { firstName: "Sarah", lastName: "Nabirye" },
    });
    if (!existingSarah) {
        await prisma.employee.create({
            data: {
                employeeNo: `EMP-${Date.now().toString(36).toUpperCase()}-1`,
                firstName: "Sarah",
                lastName: "Nabirye",
                phone: "+256700111333",
                email: "sarah.n@dalausijuice.ug",
                departmentId: prodDept.id,
                roleId: mixerRole.id,
                employmentType: "FULL_TIME",
                hireDate: new Date(new Date().getFullYear(), 0, 15),
                baseSalary: 800000,
                status: "ACTIVE",
            },
        });
    }

    const existingMoses = await prisma.employee.findFirst({
        where: { firstName: "Moses", lastName: "Okello" },
    });
    if (!existingMoses) {
        await prisma.employee.create({
            data: {
                employeeNo: `EMP-${Date.now().toString(36).toUpperCase()}-2`,
                firstName: "Moses",
                lastName: "Okello",
                phone: "+256700222444",
                departmentId: eventsDept.id,
                roleId: eventStaffRole.id,
                employmentType: "CASUAL",
                hireDate: new Date(new Date().getFullYear(), 0, 1),
                baseSalary: 30000,
                status: "ACTIVE",
            },
        });
    }

    console.log("HR seed completed.");
}
