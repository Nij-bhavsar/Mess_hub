
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5155/api"
});

// Menu API
export const getAllMenus = () => API.get("/menu");
export const getMenuById = (id) => API.get(`/menu/${id}`);
export const createMenu = (menu) => API.post("/menu", menu);
export const updateMenu = (id, menu) => API.put(`/menu/${id}`, menu);
export const deleteMenu = (id) => API.delete(`/menu/${id}`);

// Student API
export const getStudents = () => API.get("/student");
export const addStudent = (student) => API.post("/student", student);

export default API;
