import {
    findDepartments,
    findDepartmentById,
    findDepartmentsByCollege,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../models/department.model.js';

import { sendSuccess } from '../utils/response.js';

export const getDepartments = async (req, res, next) => {
    try {
        const departments = req.query.college_id
            ? await findDepartmentsByCollege(req.query.college_id)
            : await findDepartments();

        return sendSuccess(res, 'Departments retrieved successfully', departments);
    } catch (error) {
        next(error);
    }
};

export const getDepartmentById = async (req, res, next) => {
    try {
        const department = await findDepartmentById(req.params.id);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        return sendSuccess(res, 'Department retrieved successfully', department);
    } catch (error) {
        next(error);
    }
};

export const addDepartment = async (req, res, next) => {
    try {
        const { college_id, name, code } = req.body;

        if (!college_id || !name || !code) {
            return res.status(400).json({
                success: false,
                message: 'college_id, name and code are required'
            });
        }

        const department = await createDepartment(college_id, name, code);
        return sendSuccess(res, 'Department created successfully', department);
    } catch (error) {
        next(error);
    }
};

export const editDepartment = async (req, res, next) => {
    try {
        const { college_id, name, code } = req.body;

        await updateDepartment(req.params.id, college_id, name, code);

        return sendSuccess(res, 'Department updated successfully');
    } catch (error) {
        next(error);
    }
};

export const removeDepartment = async (req, res, next) => {
    try {
        await deleteDepartment(req.params.id);

        return sendSuccess(res, 'Department deleted successfully');
    } catch (error) {
        next(error);
    }
};