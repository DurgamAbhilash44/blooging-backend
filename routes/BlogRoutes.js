import express from 'express';
import Blog from '../model/Blog.js';
import User from '../model/User.js'; // ✅ Add this import
import { AuthMiddleware } from '../jwt.js';

const router = express.Router();



// ✅ Create Blog
router.post('/create', AuthMiddleware, async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized: No user found" });
    }
    const role = await User.findById(userId).select('role'); // Get the role of the user

    // if (role !== 'user') {
    //     return res.status(403).json({ message: "Forbidden: Users only" });
    // }

    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
    }

    try {
        const newBlog = new Blog({ title, content, author: userId, });
        await newBlog.save();
        res.status(201).json({ message: "Blog created successfully", blog: newBlog });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ Get Pending Blogs (Admin Only)
router.get('/getpending', AuthMiddleware, async (req, res) => {
    try {
        const id = req.user?.id;

        // Get the full user object to check role
        const user = await User.findById(id).select('role name');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let blogs;

        if (user.role === 'user') {
            // If role is user, get only their pending blogs
            blogs = await Blog.find({ status: 'pending', author: id });
        } else {
            // For admin/moderator, get all pending blogs and populate author name
            blogs = await Blog.find({ status: 'pending' })
                .populate('author', 'name email'); // you can add more fields as needed
        }

        if (!blogs.length) {
            return res.status(404).json({ message: "No pending blogs found" });
        }

       
        res.status(200).json({ message: "Pending blogs retrieved", blogs });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



// ✅ Accept Blog (Admin Only)
router.post('/accept/:id', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
          const user = await User.findById(userId).select('role');
         const role = user.role; // Get the role of the user
        if (role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        blog.status = 'accepted';
        await blog.save();
        res.status(200).json({ message: "Blog accepted", blog });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ Reject Blog (Admin Only)
router.post('/reject/:id', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await User.findById(userId).select('role');
         const role = user.role; //

        if (role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        blog.status = 'rejected';
        await blog.save();
        res.status(200).json({ message: "Blog rejected", blog });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// ✅ Get Rejected Blogs (Admin,User Only)
router.get('/getrejected', AuthMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Fetch role of the user
      const user = await User.findById(userId).select('role');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      let blogs;
  
      if (user.role === 'admin') {
        // Admin gets all rejected blogs
        blogs = await Blog.find({ status: 'rejected' }).populate('author', 'name email');
      } else {
        // Regular user gets only their rejected blogs
        blogs = await Blog.find({ status: 'rejected', author: userId });
      }
  
      if (!blogs.length) {
        return res.status(404).json({ message: "No rejected blogs found" });
      }
  
      res.status(200).json({ message: "Rejected blogs retrieved", blogs });
  
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });



//   update the blog 
// ✅ Update Blog (Author or Admin only)
router.put('/update/:id', AuthMiddleware, async (req, res) => {
    const blogId = req.params.id;
    const userId = req.user.id;
  
    try {
      const user = await User.findById(userId).select('role');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const blog = await Blog.findById(blogId);
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }
  
      // Check if the user is either the blog author or an admin
      const isOwner = blog.author.toString() === userId;
      const isAdmin = user.role === 'admin';
  
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this blog" });
      }
  
      // Update fields
      const { title, content } = req.body;
  
      if (title) blog.title = title;
      if (content) blog.content = content;
  
      // Force status to "pending" after any update
      blog.status = 'pending';
  
      const updatedBlog = await blog.save();
      res.status(200).json({ message: "Blog updated successfully. Status set to 'pending'.", blog: updatedBlog });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  

// ✅ Delete Blog (Author or Admin only)
router.delete('/delete/:id', AuthMiddleware, async (req, res) => {
  const blogId = req.params.id;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select('role');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const isOwner = blog.author.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this blog" });
    }

    await blog.deleteOne();
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// get all the accepted blogs of the user

router.get('/getaccepted', AuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
  
        // Fetch role of the user
        const user = await User.findById(userId).select('role');
        const role = user.role;

        let blogs;
          console.log(user)
        if (role === 'admin') {
            // Admin sees all accepted blogs
            blogs = await Blog.find({ status: 'accepted' });
        } else if (role === 'user') {
            // User sees only their own accepted blogs
            blogs = await Blog.find({ status: 'accepted', author: user});
        } else {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        if (!blogs.length) {
            return res.status(404).json({ message: "No accepted blogs found" });
        }

        res.status(200).json({ message: "Accepted blogs retrieved", blogs });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// ✅ Like or Unlike Blog (User only)
router.post('/like/:id', AuthMiddleware, async (req, res) => {
  const blogId = req.params.id;
  const userId = req.user.id;

  try {
      const user = await User.findById(userId).select('role');
      if (!user || user.role !== 'user') {
          return res.status(403).json({ message: "Forbidden: Users only" });
      }

      const blog = await Blog.findById(blogId);
      if (!blog) {
          return res.status(404).json({ message: "Blog not found" });
      }

      // Check if the user has already liked the blog
      const alreadyLiked = blog.likes.some(like => like.user.toString() === userId);

      if (alreadyLiked) {
          // If already liked, remove the like
          blog.likes = blog.likes.filter(like => like.user.toString() !== userId);
          await blog.save();
          return res.status(200).json({ message: "Like removed", blog });
      } else {
          // If not liked yet, add like
          blog.likes.push({ user: userId });
          await blog.save();
          return res.status(200).json({ message: "Blog liked", blog });
      }

  } catch (error) {
      console.error(error); // Helpful for debugging
      res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Comment on Blog (User only)

// ✅ Add Comment on Blog (User only)
router.post('/comment/:id', AuthMiddleware, async (req, res) => {
  const blogId = req.params.id;
  const userId = req.user.id;
  const { comment } = req.body;

  if (!comment) {
      return res.status(400).json({ message: "Comment is required" });
  }

  try {
      const user = await User.findById(userId).select('role');
      if (!user || user.role !== 'user') {
          return res.status(403).json({ message: "Forbidden: Users only" });
      }

      const blog = await Blog.findById(blogId);
      if (!blog) {
          return res.status(404).json({ message: "Blog not found" });
      }

      blog.comments.push({ user: userId, comment });
      await blog.save();

      res.status(201).json({ message: "Comment added successfully", blog });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.get('/getallblogs', AuthMiddleware, async (req, res) => {
    try {
        const blogs = (await Blog.find({}).populate('author', 'name email')).filter(blog => blog.status === 'accepted' );
        if (!blogs.length) {
            return res.status(404).json({ message: "No blogs found" });
        }
        res.status(200).json({ message: "All blogs retrieved", blogs });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
export default router;

