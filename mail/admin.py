from django.contrib import admin
from .models import Email, User

# Register your models here.
class EmailAdmin(admin.ModelAdmin):
    list_display = ("id","user", "sender", "subject","timestamp", "read", "archived")


admin.site.register(Email, EmailAdmin)
admin.site.register(User)