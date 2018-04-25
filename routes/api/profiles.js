// dependencies
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const profileRouter = express.Router();

// get validation
const validateProfileInput = require("../../validation/profile");

// get models
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route  GET api/profiles/test
// @desc   Test profiles route
// @access Public
profileRouter.get("/test", (req, res) => res.json({ msg: "profile router" }));

// @route  GET api/profiles
// @desc   Get current user profile
// @access Private
profileRouter.get(
	"/",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const errors = {};
		Profile.findOne({ user: req.user.id })
			.populate("user", ["name", "avatar"])
			.then(profile => {
				if (!profile) {
					errors.noprofile = "No profile for this user.";
					return res.status(404).json(errors);
				}
				res.json(profile);
			})
			.catch(err => res.status(404).json(err));
	}
);

// @route  POST api/profiles
// @desc   Create or edit user profile
// @access Private
profileRouter.post(
	"/",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validateProfileInput(req.body);
		if (!isValid) {
			return res.status(400).json(errors);
		}
		const profileFields = {};
		profileFields.user = req.user.id;
		if (req.body.handle) profileFields.handle = req.body.handle;
		if (req.body.company) profileFields.company = req.body.company;
		if (req.body.website) profileFields.website = req.body.website;
		if (req.body.location) profileFields.location = req.body.location;
		if (req.body.bio) profileFields.bio = req.body.bio;
		if (req.body.status) profileFields.status = req.body.status;
		if (req.body.githubusername)
			profileFields.githubusername = req.body.githubusername;

		if (typeof req.body.skills !== "undefined") {
			profileFields.skills = req.body.skills.split(",");
		}

		profileFields.social = {};
		if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
		if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
		if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
		if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
		if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

		Profile.findOne({ user: req.user.id }).then(profile => {
			if (profile) {
				// update
				Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				).then(profile => res.json(profile));
			} else {
				//create
				Profile.findOne({ handle: profileFields.handle }).then(profile => {
					if (profile) {
						errors.handle = "That handle already exists.";
						return res.status(400).json(errors);
					}
					new Profile(profileFields).save().then(profile => res.json(profile));
				});
			}
		});
	}
);

module.exports = profileRouter;
