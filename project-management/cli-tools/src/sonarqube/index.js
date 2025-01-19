const sonarqubeUrl = 'https://sonar-dev.fleetship.com'; // replace with your SonarQube server URL
const adminToken = process.env.SONARQUBE_TOKEN;

const createSonarQubeUser = async (login, name, password, email) => {
    const response = await fetch(`${sonarqubeUrl}/api/users/create`, {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(adminToken + ':'),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            login,
            name,
            password,
            email
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

export default {
    createSonarQubeUser,
}